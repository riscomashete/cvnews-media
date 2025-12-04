import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '../services/db';
import { Article } from '../types';
import ArticleCard from '../components/ArticleCard';

const Search: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const doSearch = async () => {
      setLoading(true);
      const allArticles = await db.getArticles();
      const published = allArticles.filter(a => a.published);
      
      const lowerQuery = query.toLowerCase();
      const filtered = published.filter(article => 
        article.title.toLowerCase().includes(lowerQuery) || 
        article.excerpt.toLowerCase().includes(lowerQuery) ||
        article.category.toLowerCase().includes(lowerQuery) ||
        article.author.toLowerCase().includes(lowerQuery)
      );
      
      setResults(filtered);
      setLoading(false);
    };

    if (query) {
      doSearch();
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [query]);

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8 dark:text-white">
        Search Results for: <span className="text-brand-red">"{query}"</span>
      </h1>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Searching...</div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {results.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No stories found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default Search;