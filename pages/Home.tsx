import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { Article } from '../types';
import ArticleCard from '../components/ArticleCard';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [featured, setFeatured] = useState<Article | null>(null);
  
  // Newsletter State
  const [subEmail, setSubEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    const fetchArticles = async () => {
      const data = await db.getArticles();
      const published = data.filter(a => a.published);
      if (published.length > 0) {
        setFeatured(published[0]);
        setArticles(published.slice(1));
      }
    };
    fetchArticles();
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subEmail) return;
    
    setSubStatus('loading');
    try {
      await db.subscribe(subEmail);
      setSubStatus('success');
      setSubEmail('');
    } catch (error) {
      setSubStatus('error');
    }
  };

  return (
    <div className="pb-20">
      {/* Featured Section */}
      {featured && (
        <section className="bg-black text-white relative">
          <div className="absolute inset-0 opacity-40">
             <img src={featured.imageUrl} className="w-full h-full object-cover" alt="Featured background" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
          
          <div className="container mx-auto px-4 relative z-10 py-20 md:py-32 flex flex-col justify-end min-h-[60vh]">
            <div className="max-w-3xl">
              <span className="inline-block bg-brand-red text-white text-xs font-bold px-3 py-1 mb-4 uppercase tracking-widest">
                Latest Feature
              </span>
              <Link to={`/article/${featured.id}`}>
                <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 leading-tight hover:text-gray-300 transition">
                  {featured.title}
                </h1>
              </Link>
              <p className="text-lg md:text-xl text-gray-300 mb-6 leading-relaxed">
                {featured.excerpt}
              </p>
              <div className="flex items-center text-sm text-gray-400 gap-4">
                <span className="text-white font-bold">{featured.author}</span>
                <span>{new Date(featured.createdAt).toDateString()}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Latest News Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8 border-b border-gray-200 dark:border-gray-800 pb-4">
          <h2 className="text-2xl font-bold uppercase tracking-wider dark:text-white">Latest Stories</h2>
          <span className="text-sm text-gray-500">The Pulse of Namibia</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
        
        {articles.length === 0 && !featured && (
           <div className="text-center py-20 text-gray-500">Loading articles or no content available...</div>
        )}
      </section>

      {/* Newsletter / CTA */}
      <section className="bg-brand-red text-white py-16 mt-8">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-3xl font-serif font-bold mb-4">Subscribe to CVNEWS</h2>
          <p className="mb-8 text-red-100">Get the latest SME news and business insights delivered directly to your WhatsApp or Email.</p>
          
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="w-full sm:w-auto flex-grow max-w-md">
              <input 
                type="email" 
                placeholder="Your email address" 
                value={subEmail}
                onChange={(e) => setSubEmail(e.target.value)}
                className="w-full px-6 py-3 rounded-none text-black focus:outline-none disabled:opacity-50"
                disabled={subStatus === 'loading' || subStatus === 'success'}
                required
              />
            </div>
            <button 
              type="submit"
              disabled={subStatus === 'loading' || subStatus === 'success'}
              className="bg-black text-white px-8 py-3 font-bold uppercase tracking-wide hover:bg-gray-900 transition disabled:opacity-50"
            >
              {subStatus === 'loading' ? 'Subscribing...' : subStatus === 'success' ? 'Subscribed!' : 'Subscribe'}
            </button>
          </form>
          {subStatus === 'success' && <p className="mt-4 text-green-200 font-bold">Thank you for subscribing!</p>}
          {subStatus === 'error' && <p className="mt-4 text-white font-bold bg-red-800 inline-block px-2">Something went wrong. Please try again.</p>}
        </div>
      </section>
    </div>
  );
};

export default Home;