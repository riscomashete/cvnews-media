import React from 'react';
import { Link } from 'react-router-dom';
import { Article } from '../types';

const ArticleCard: React.FC<{ article: Article }> = ({ article }) => {
  return (
    <div className="group block h-full flex flex-col">
      <Link to={`/article/${article.id}`} className="block relative overflow-hidden aspect-video bg-gray-200">
        <img 
          src={article.imageUrl} 
          alt={article.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </Link>
      
      {/* Category Tag - Now clickable */}
      <div className="absolute top-0 left-0 z-10 p-0">
         <Link 
            to={`/category/${article.category}`}
            className="inline-block bg-brand-red text-white text-xs font-bold px-3 py-1 uppercase hover:bg-black transition-colors"
         >
           {article.category}
         </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 border-x border-b border-gray-100 dark:border-gray-700 p-6 flex flex-col flex-grow shadow-sm hover:shadow-lg transition-shadow">
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3 space-x-2">
          <span className="font-semibold text-brand-red">{article.author}</span>
          <span>•</span>
          <span>{new Date(article.createdAt).toLocaleDateString()}</span>
          {article.views > 0 && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                 {article.views}
              </span>
            </>
          )}
        </div>
        <Link to={`/article/${article.id}`} className="block">
           <h3 className="text-xl font-bold font-serif text-gray-900 dark:text-white mb-3 leading-tight group-hover:text-brand-red transition-colors">
             {article.title}
           </h3>
        </Link>
        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-3 mb-4 flex-grow">
          {article.excerpt}
        </p>
        <Link to={`/article/${article.id}`} className="mt-auto text-brand-red font-bold text-xs uppercase tracking-wider hover:underline">
          Read Story
        </Link>
      </div>
    </div>
  );
};

export default ArticleCard;