import React from 'react';
import { Link } from 'react-router-dom';
import { Article } from '../types';

const ArticleCard: React.FC<{ article: Article }> = ({ article }) => {
  return (
    <Link to={`/article/${article.id}`} className="group block h-full">
      <div className="bg-white dark:bg-gray-800 h-full shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-gray-700 flex flex-col">
        <div className="relative overflow-hidden aspect-video bg-gray-200">
          <img 
            src={article.imageUrl} 
            alt={article.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute top-0 left-0 bg-brand-red text-white text-xs font-bold px-3 py-1 uppercase">
            {article.category}
          </div>
        </div>
        <div className="p-6 flex flex-col flex-grow">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3 space-x-2">
            <span className="font-semibold text-brand-red">{article.author}</span>
            <span>•</span>
            <span>{new Date(article.createdAt).toLocaleDateString()}</span>
          </div>
          <h3 className="text-xl font-bold font-serif text-gray-900 dark:text-white mb-3 leading-tight group-hover:text-brand-red transition-colors">
            {article.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-3 mb-4 flex-grow">
            {article.excerpt}
          </p>
          <div className="mt-auto text-brand-red font-bold text-xs uppercase tracking-wider group-hover:underline">
            Read Story
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ArticleCard;