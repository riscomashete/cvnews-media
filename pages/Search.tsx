import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '../services/db';
import { Article } from '../types';
import ArticleCard from '../components/ArticleCard';
import Pagination from '../components/Pagination';

const ITEMS_PER_PAGE = 9;

const Search: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const doSearch = async () => {
      setLoading(true);
      setCurrentPage(1); // Reset page on new query
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

  // Pagination Logic
  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);
  const displayedResults = results.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8 dark:text-white">
        Search Results for: <span className="text-brand-red">"{query}"</span>
      </h1>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Searching...</div>
      ) : results.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {displayedResults.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No stories found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default Search;