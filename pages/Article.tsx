import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../services/db';
import { Article as ArticleType } from '../types';
import ArticleCard from '../components/ArticleCard';

const Article: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<ArticleType | null>(null);
  const [related, setRelated] = useState<ArticleType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setArticle(null);
      setRelated([]);
      
      if (id) {
        const data = await db.getArticleById(id);
        if (data) {
          setArticle(data);
          // Fetch related articles once the main article is loaded
          const relatedData = await db.getRelatedArticles(data.id, data.category);
          setRelated(relatedData);
        }
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleShare = async (platform: 'facebook' | 'twitter' | 'whatsapp' | 'copy') => {
    if (!article) return;
    const url = window.location.href;
    const text = `Check out this article on CVNEWS: ${article.title}`;

    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy', err);
      }
      return;
    }

    // Mobile Native Share
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url: url,
        });
        return;
      } catch (err) {
        // Fallback if user cancels or it fails
      }
    }

    // Desktop Fallbacks
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
    }
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  if (loading) return <div className="p-20 text-center dark:text-white">Loading story...</div>;
  if (!article) return <div className="p-20 text-center dark:text-white">Article not found.</div>;

  return (
    <article className="pb-20 bg-white dark:bg-gray-900">
      {/* Header Image */}
      <div className="h-[50vh] w-full relative">
        <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black opacity-30"></div>
      </div>

      <div className="container mx-auto px-4 -mt-20 relative z-10">
        <div className="bg-white dark:bg-gray-800 p-8 md:p-12 shadow-xl max-w-4xl mx-auto rounded-sm">
          <div className="flex items-center justify-between mb-6">
            <span className="bg-brand-red text-white px-3 py-1 text-xs font-bold uppercase">{article.category}</span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">{new Date(article.createdAt).toLocaleDateString()}</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            {article.title}
          </h1>

          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-8 mb-8 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xl">
                👤
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">By {article.author}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">CVNEWS MEDIA CC Contributor</p>
              </div>
            </div>

            {/* Social Sharing */}
            <div className="flex gap-2">
              <span className="text-xs font-bold uppercase text-gray-500 self-center mr-2">Share:</span>
              <button onClick={() => handleShare('facebook')} className="bg-[#1877F2] text-white p-2 rounded-full hover:opacity-80" aria-label="Share on Facebook">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </button>
              <button onClick={() => handleShare('twitter')} className="bg-black text-white p-2 rounded-full hover:opacity-80" aria-label="Share on X">
                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </button>
              <button onClick={() => handleShare('whatsapp')} className="bg-[#25D366] text-white p-2 rounded-full hover:opacity-80" aria-label="Share on WhatsApp">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </button>
              <button onClick={() => handleShare('copy')} className="bg-gray-200 text-gray-700 p-2 rounded-full hover:bg-gray-300" aria-label="Copy Link">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              </button>
            </div>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none font-serif leading-loose" 
               dangerouslySetInnerHTML={{ __html: article.content }} />
        </div>

        {/* RELATED ARTICLES */}
        {related.length > 0 && (
          <div className="max-w-4xl mx-auto mt-16">
            <h3 className="text-2xl font-bold mb-6 dark:text-white border-l-4 border-brand-red pl-4">
              More in {article.category}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map(r => (
                 <ArticleCard key={r.id} article={r} />
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
};

export default Article;