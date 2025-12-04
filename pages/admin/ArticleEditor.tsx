import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RichTextEditor from '../../components/RichTextEditor';
import { db } from '../../services/db';
// Removed Firebase Storage imports to avoid billing issues
import { generateSummary, generateSEO, proofreadContent, generateHeadlines, generateCoverImage } from '../../services/gemini';
import { Article } from '../../types';
import { useAuth } from '../../context/AuthContext';

const PREDEFINED_CATEGORIES = ['News', 'Business', 'Technology', 'Culture', 'Politics'];

const ArticleEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdminOrEditor } = useAuth();
  
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // AI States
  const [analyzingSeo, setAnalyzingSeo] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [generatingHeadlines, setGeneratingHeadlines] = useState(false);
  const [suggestedHeadlines, setSuggestedHeadlines] = useState<string[]>([]);
  const [generatingImage, setGeneratingImage] = useState(false);

  // UI State for Custom Category
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    author: '',
    category: 'News',
    imageUrl: 'https://picsum.photos/seed/new/800/600',
    published: false,
    seoTitle: '',
    metaDescription: '',
    keywords: ''
  });

  useEffect(() => {
    // Set default author name for new articles
    if (!id && user) {
      setFormData(prev => ({ ...prev, author: user.name }));
    }

    if (id) {
      const loadArticle = async () => {
        setFetching(true);
        try {
          const article = await db.getArticleById(id);
          if (article) {
            setFormData({
              title: article.title,
              excerpt: article.excerpt,
              content: article.content,
              author: article.author,
              category: article.category,
              imageUrl: article.imageUrl,
              published: article.published,
              seoTitle: article.seoTitle || '',
              metaDescription: article.metaDescription || '',
              keywords: article.keywords || ''
            });
            // Check if loaded category is custom
            if (!PREDEFINED_CATEGORIES.includes(article.category)) {
              setIsCustomCategory(true);
            }
          } else {
            alert('Article not found');
            navigate('/admin');
          }
        } catch (error) {
          console.error("Failed to load article", error);
        } finally {
          setFetching(false);
        }
      };
      loadArticle();
    }
  }, [id, navigate, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Security check: If user isn't admin/editor, enforce published=false for new articles
    let dataToSave = { ...formData };
    
    if (!isAdminOrEditor) {
      if (!id) {
        dataToSave.published = false;
      }
    }

    try {
      if (id) {
        await db.updateArticle(id, dataToSave);
      } else {
        await db.createArticle(dataToSave);
      }
      navigate('/admin');
    } catch (error) {
      console.error("Error saving article:", error);
      alert("Failed to save article: " + (error as any).message);
    } finally {
      setSaving(false);
    }
  };

  const handleAiSummary = async () => {
    if (!formData.content) {
      alert("Please enter article content first.");
      return;
    }
    setGeneratingAi(true);
    const summary = await generateSummary(formData.content);
    setFormData(prev => ({ ...prev, excerpt: summary }));
    setGeneratingAi(false);
  };

  const handleAiSeo = async () => {
    if (!formData.content) return alert("Please add content first.");
    setAnalyzingSeo(true);
    const result = await generateSEO(formData.content);
    if (result) {
      setFormData(prev => ({
        ...prev,
        seoTitle: result.seoTitle,
        metaDescription: result.metaDescription,
        keywords: result.keywords
      }));
    } else {
      alert("Failed to generate SEO data.");
    }
    setAnalyzingSeo(false);
  };

  const handleAiPolish = async () => {
    if (!formData.content) return;
    if (!confirm("This will use Gemini Pro to rewrite your content for grammar, flow, and clarity. It may take a few seconds. Continue?")) return;
    
    setPolishing(true);
    try {
      const polished = await proofreadContent(formData.content);
      if (polished) {
        setFormData(prev => ({ ...prev, content: polished }));
      }
    } catch (e) {
      alert("Failed to polish content.");
    }
    setPolishing(false);
  };

  const handleSuggestHeadlines = async () => {
    if (!formData.content) return alert("Add some content first so AI can suggest titles.");
    setGeneratingHeadlines(true);
    const titles = await generateHeadlines(formData.content);
    setSuggestedHeadlines(titles);
    setGeneratingHeadlines(false);
  };

  const handleGenerateImage = async () => {
    const promptText = formData.title || formData.excerpt;
    if (!promptText) return alert("Enter a title or excerpt first to generate an image.");
    
    setGeneratingImage(true);
    const b64Image = await generateCoverImage(promptText);
    
    if (b64Image) {
      setFormData(prev => ({ ...prev, imageUrl: b64Image }));
    } else {
      alert("Could not generate image. Please try again.");
    }
    setGeneratingImage(false);
  };

  // Convert file to Base64 with resizing to prevent large DB documents
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          // Create canvas to resize
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          
          // Only resize if width > MAX_WIDTH
          if (scaleSize < 1) {
             canvas.width = MAX_WIDTH;
             canvas.height = img.height * scaleSize;
          } else {
             canvas.width = img.width;
             canvas.height = img.height;
          }

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Convert to Base64 string (JPEG 0.7 quality)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          
          setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
          setUploadingImage(false);
        };
      };
      reader.onerror = () => {
        setUploadError("Failed to read file.");
        setUploadingImage(false);
      };
    } catch (error: any) {
      console.error("Error processing image:", error);
      setUploadError("Failed to process image.");
      setUploadingImage(false);
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'CUSTOM_OPTION') {
      setIsCustomCategory(true);
      setFormData(prev => ({ ...prev, category: '' }));
    } else {
      setIsCustomCategory(false);
      setFormData(prev => ({ ...prev, category: value }));
    }
  };

  if (fetching) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red mb-4"></div>
          <p className="dark:text-white">Loading article data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">{id ? 'Edit Article' : 'New Article'}</h1>
      
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative">
            <div className="flex justify-between items-center mb-2">
              <label className="block font-bold dark:text-gray-300">Title</label>
              <button 
                type="button" 
                onClick={handleSuggestHeadlines}
                disabled={generatingHeadlines || !formData.content}
                className="text-xs text-brand-red font-bold uppercase hover:underline disabled:opacity-50"
              >
                {generatingHeadlines ? 'Brainstorming...' : 'Suggest Headlines'}
              </button>
            </div>
            
            {suggestedHeadlines.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-gray-700 rounded border border-red-100 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-300 mb-2 font-bold uppercase">AI Suggestions (Click to use):</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedHeadlines.map((h, i) => (
                    <button 
                      key={i}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({...prev, title: h}));
                        setSuggestedHeadlines([]);
                      }}
                      className="text-xs bg-white dark:bg-gray-800 border px-2 py-1 rounded hover:border-brand-red dark:text-white text-left"
                    >
                      {h}
                    </button>
                  ))}
                  <button type="button" onClick={() => setSuggestedHeadlines([])} className="text-xs text-gray-400 hover:text-gray-600 px-2">Clear</button>
                </div>
              </div>
            )}

            <input 
              required
              type="text" 
              className="w-full border p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-xl font-serif"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="Enter article title"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block font-bold dark:text-gray-300">Content</label>
              <button
                type="button"
                onClick={handleAiPolish}
                disabled={polishing || !formData.content}
                className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
                title="Uses Gemini 3 Pro to fix grammar and improve flow"
              >
                {polishing ? (
                  <>
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    Polishing...
                  </>
                ) : (
                  '✨ Proofread & Polish'
                )}
              </button>
            </div>
            <RichTextEditor 
              initialValue={formData.content}
              onChange={content => setFormData(prev => ({ ...prev, content }))}
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700">
             <div className="flex justify-between items-center mb-2">
                <label className="block font-bold dark:text-gray-300">Excerpt (Summary)</label>
                <button 
                  type="button"
                  onClick={handleAiSummary}
                  disabled={generatingAi}
                  className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                >
                  {generatingAi ? 'Thinking...' : '✨ Summarize with Gemini'}
                </button>
             </div>
            <textarea 
              rows={3}
              className="w-full border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
              value={formData.excerpt}
              onChange={e => setFormData({...formData, excerpt: e.target.value})}
              placeholder="Short summary for the home page..."
            ></textarea>
          </div>

          {/* New SEO Section */}
          <div className="bg-white dark:bg-gray-800 p-6 shadow border dark:border-gray-700">
            <div className="flex justify-between items-center mb-4 border-b pb-2 dark:border-gray-700">
              <h3 className="font-bold text-lg dark:text-white">Search Engine Optimization (SEO)</h3>
              <button 
                  type="button"
                  onClick={handleAiSeo}
                  disabled={analyzingSeo || !formData.content}
                  className="text-xs bg-teal-600 text-white px-3 py-1 rounded hover:bg-teal-700 disabled:opacity-50 flex items-center gap-1"
                >
                  {analyzingSeo ? 'Analyzing...' : '✨ Auto-Fill SEO'}
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1 dark:text-gray-300">SEO Title</label>
                <p className="text-xs text-gray-500 mb-1">Recommended: 50-60 characters. Defaults to article title if empty.</p>
                <input 
                  type="text" 
                  className="w-full border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.seoTitle}
                  onChange={e => setFormData({...formData, seoTitle: e.target.value})}
                  placeholder={formData.title}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1 dark:text-gray-300">Meta Description</label>
                <p className="text-xs text-gray-500 mb-1">Recommended: 150-160 characters. Defaults to excerpt if empty.</p>
                <textarea 
                  rows={3}
                  className="w-full border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.metaDescription}
                  onChange={e => setFormData({...formData, metaDescription: e.target.value})}
                  placeholder={formData.excerpt}
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1 dark:text-gray-300">Keywords</label>
                <p className="text-xs text-gray-500 mb-1">Comma-separated list of keywords.</p>
                <input 
                  type="text" 
                  className="w-full border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.keywords}
                  onChange={e => setFormData({...formData, keywords: e.target.value})}
                  placeholder="e.g. business, finance, namibia sme"
                />
              </div>
            </div>
          </div>

        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 shadow border dark:border-gray-700">
            <h3 className="font-bold mb-4 dark:text-white">Article Details</h3>
            
            <div className="mb-4">
               <label className="block text-sm mb-1 dark:text-gray-300">Author</label>
               <input 
                 type="text" 
                 className="w-full border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                 value={formData.author}
                 onChange={e => setFormData({...formData, author: e.target.value})}
               />
            </div>

            <div className="mb-4">
              <label className="block text-sm mb-1 dark:text-gray-300">Category</label>
              <select 
                className="w-full border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-2"
                value={isCustomCategory ? 'CUSTOM_OPTION' : formData.category}
                onChange={handleCategoryChange}
              >
                {PREDEFINED_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="CUSTOM_OPTION">Custom / Other</option>
              </select>
              
              {isCustomCategory && (
                <input 
                  type="text"
                  placeholder="Enter custom category"
                  className="w-full border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white border-brand-red bg-red-50 dark:bg-gray-900"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  autoFocus
                />
              )}
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                 <label className="block text-sm dark:text-gray-300">Featured Image</label>
                 <button 
                    type="button" 
                    onClick={handleGenerateImage}
                    disabled={generatingImage}
                    className="text-[10px] bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-0.5 rounded font-bold uppercase hover:opacity-90 disabled:opacity-50"
                 >
                    {generatingImage ? 'Generating...' : '✨ Generate AI Image'}
                 </button>
              </div>
              
              {/* File Upload Input */}
              <div className="mb-2">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-xs file:font-semibold
                    file:bg-brand-red file:text-white
                    hover:file:bg-red-700
                    dark:text-gray-400
                  "
                />
                {uploadingImage && <span className="text-xs text-brand-red animate-pulse">Processing Image...</span>}
                {uploadError && <p className="text-xs text-red-600 mt-1 font-bold">{uploadError}</p>}
              </div>

              <div className="relative">
                <span className="text-xs text-gray-400 absolute -top-5 right-0">or enter URL</span>
                <input 
                  type="text" 
                  className="w-full border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-xs"
                  value={formData.imageUrl}
                  onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                  placeholder="https://..."
                />
              </div>

              {formData.imageUrl && (
                <div className="mt-2 relative h-32 w-full overflow-hidden bg-gray-100 dark:bg-gray-900 border dark:border-gray-700">
                  <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                </div>
              )}
            </div>

            {/* Publishing Control - Only for Admin/Editor */}
            {isAdminOrEditor ? (
              <div className="flex items-center gap-2 mb-6 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <input 
                  type="checkbox" 
                  id="pub"
                  checked={formData.published}
                  onChange={e => setFormData({...formData, published: e.target.checked})}
                  className="w-4 h-4 text-brand-red focus:ring-brand-red"
                />
                <label htmlFor="pub" className="dark:text-white cursor-pointer select-none font-bold">Published</label>
              </div>
            ) : (
              <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-sm rounded">
                <span className="font-bold">Status:</span> {formData.published ? 'Published' : 'Draft'}
                <br />
                <span className="text-xs opacity-75">(Only Editors can publish)</span>
              </div>
            )}

            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => navigate('/admin')}
                className="flex-1 bg-gray-200 text-gray-800 py-2 hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={saving || uploadingImage}
                className="flex-1 bg-brand-red text-white py-2 font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : (isAdminOrEditor ? 'Save Story' : 'Submit Draft')}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ArticleEditor;