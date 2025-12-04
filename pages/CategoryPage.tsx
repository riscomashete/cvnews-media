import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../services/db';
import { Article } from '../types';
import ArticleCard from '../components/ArticleCard';
import AnnouncementsWidget from '../components/AnnouncementsWidget';
import EventsWidget from '../components/EventsWidget';
import Pagination from '../components/Pagination';

const ITEMS_PER_PAGE = 6;

const CategoryPage: React.FC = () => {
  const { categoryName } = useParams<{ categoryName: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setCurrentPage(1); // Reset page on category change
      if (categoryName) {
        const data = await db.getArticlesByCategory(categoryName);
        setArticles(data.filter(a => a.published));
      }
      setLoading(false);
    };
    load();
  }, [categoryName]);

  // Pagination Logic
  const totalPages = Math.ceil(articles.length / ITEMS_PER_PAGE);
  const displayedArticles = articles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container mx-auto px-4 py-16 min-h-[60vh]">
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="lg:w-2/3">
            <div className="flex items-center gap-4 mb-8 border-b border-gray-200 dark:border-gray-800 pb-4">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Category</span>
                <h1 className="text-3xl font-bold font-serif dark:text-white capitalize">{categoryName}</h1>
            </div>

            {loading ? (
                <div className="text-center py-20">Loading...</div>
            ) : articles.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {displayedArticles.map(article => (
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
                  <p className="text-gray-500 dark:text-gray-400">No stories found in this category yet.</p>
                </div>
            )}
        </div>

        {/* Sidebar */}
        <div className="lg:w-1/3 space-y-8">
             <AnnouncementsWidget />
             <EventsWidget />
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;