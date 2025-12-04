import React, { useEffect, useState } from 'react';
import { db } from '../../services/db';
import { Advertisement } from '../../types';

const AdsManager: React.FC = () => {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'image' | 'video'>('image');
  const [linkUrl, setLinkUrl] = useState('');
  const [mediaUrl, setMediaUrl] = useState(''); // Stores Base64 for images or URL for video
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    const data = await db.getAds();
    setAds(data);
    setLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      // Compress/Resize logic similar to articles
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const scale = MAX_WIDTH / img.width;
        
        if (scale < 1) {
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scale;
        } else {
            canvas.width = img.width;
            canvas.height = img.height;
        }

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setMediaUrl(canvas.toDataURL('image/jpeg', 0.8));
        setUploading(false);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl) return alert("Please upload an image or enter a video URL");

    await db.createAd({
      title,
      type,
      mediaUrl,
      linkUrl,
      active: true
    });

    // Reset Form
    setTitle('');
    setLinkUrl('');
    setMediaUrl('');
    loadAds();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this advertisement?")) {
      await db.deleteAd(id);
      loadAds();
    }
  };

  const handleToggle = async (ad: Advertisement) => {
    await db.toggleAdStatus(ad.id, ad.active);
    loadAds();
  };

  if (loading) return <div className="p-8 text-center">Loading ads...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 dark:text-white">Ads & Announcements</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Form */}
        <div className="bg-white dark:bg-gray-800 p-6 shadow h-fit border-t-4 border-blue-600">
          <h2 className="text-xl font-bold mb-4 dark:text-white">New Advertisement</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-bold mb-1 dark:text-gray-300">Title (Internal)</label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                className="w-full border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold mb-1 dark:text-gray-300">Type</label>
              <select 
                value={type} 
                onChange={e => setType(e.target.value as any)}
                className="w-full border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="image">Image Banner</option>
                <option value="video">Video Embed (YouTube)</option>
              </select>
            </div>

            {type === 'image' ? (
              <div className="mb-4">
                <label className="block text-sm font-bold mb-1 dark:text-gray-300">Upload Image</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full text-sm dark:text-gray-300"
                />
                {uploading && <p className="text-xs text-blue-500">Processing...</p>}
                {mediaUrl && <img src={mediaUrl} alt="Preview" className="mt-2 h-20 object-contain" />}
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-bold mb-1 dark:text-gray-300">Video Embed URL</label>
                <input 
                  type="text" 
                  value={mediaUrl} 
                  onChange={e => setMediaUrl(e.target.value)} 
                  placeholder="https://www.youtube.com/embed/..."
                  className="w-full border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-bold mb-1 dark:text-gray-300">Link URL (Optional)</label>
              <input 
                type="text" 
                value={linkUrl} 
                onChange={e => setLinkUrl(e.target.value)} 
                placeholder="https://..."
                className="w-full border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <button 
              type="submit" 
              disabled={uploading}
              className="w-full bg-blue-600 text-white font-bold py-2 hover:bg-blue-700 transition"
            >
              Add Advertisement
            </button>
          </form>
        </div>

        {/* Ads List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-bold dark:text-white">Active & Inactive Ads</h2>
          {ads.map(ad => (
            <div key={ad.id} className={`flex items-start gap-4 p-4 border rounded ${ad.active ? 'bg-white dark:bg-gray-800 border-green-200' : 'bg-gray-100 dark:bg-gray-900 border-gray-300 opacity-70'}`}>
              <div className="w-24 h-16 bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                {ad.type === 'image' ? (
                  <img src={ad.mediaUrl} alt={ad.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">📺</span>
                )}
              </div>
              <div className="flex-grow">
                <h3 className="font-bold dark:text-white">{ad.title}</h3>
                <div className="text-xs text-gray-500 space-x-2">
                  <span>{ad.type.toUpperCase()}</span>
                  <span>•</span>
                  <span>{new Date(ad.createdAt).toLocaleDateString()}</span>
                  {ad.linkUrl && <a href={ad.linkUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline ml-2">Visit Link</a>}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => handleToggle(ad)}
                  className={`text-xs px-2 py-1 font-bold rounded ${ad.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}
                >
                  {ad.active ? 'Active' : 'Inactive'}
                </button>
                <button 
                  onClick={() => handleDelete(ad.id)}
                  className="text-xs text-red-600 font-bold hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {ads.length === 0 && <p className="text-gray-500">No advertisements found.</p>}
        </div>
      </div>
    </div>
  );
};

export default AdsManager;