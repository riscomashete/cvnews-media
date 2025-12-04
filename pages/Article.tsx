import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../services/db';
import { Article as ArticleType } from '../types';
import AdBanner from '../components/AdBanner';

const Article: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<ArticleType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (id) {
        const data = await db.getArticleById(id);
        setArticle(data || null);
      }
      setLoading(false);
    };
    load();
  }, [id]);

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

          <div className="flex items-center gap-4 border-b border-gray-100 dark:border-gray-700 pb-8 mb-8">
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xl">
              👤
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-sm">By {article.author}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">CVNEWS MEDIA CC Contributor</p>
            </div>
          </div>

          <AdBanner placement="content" />

          <div className="prose prose-lg dark:prose-invert max-w-none font-serif leading-loose" 
               dangerouslySetInnerHTML={{ __html: article.content }} />
        </div>
      </div>
    </article>
  );
};

export default Article;