
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../services/db';
import { Article } from '../../types';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../../components/Pagination';

const ITEMS_PER_PAGE = 8;

const Dashboard: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const { user, isAdminOrEditor } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    const data = await db.getArticles();
    setArticles(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    
    try {
      await db.deleteArticle(id);
      // Update local state directly to reflect change immediately and avoid cache issues
      setArticles(prev => prev.filter(article => article.id !== id));
    } catch (error) {
      console.error("Failed to delete article", error);
      alert("Failed to delete article. Please try again.");
    }
  };

  const togglePublish = async (article: Article) => {
    if (!isAdminOrEditor) return;
    await db.updateArticle(article.id, { published: !article.published });
    // For update, we can re-fetch or update local state. Re-fetching is usually safer for simple status toggles, 
    // but local update is faster. Let's stick to re-fetch for status to ensure consistency, or update local.
    // Let's update local to match the pattern.
    setArticles(prev => prev.map(a => a.id === article.id ? { ...a, published: !a.published } : a));
  };

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

  // Metrics Calculation
  const totalViews = articles.reduce((acc, curr) => acc + (curr.views || 0), 0);
  const publishedCount = articles.filter(a => a.published).length;
  const draftCount = articles.length - publishedCount;

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
           <h1 className="text-3xl font-bold dark:text-white font-serif text-gray-900">Editorial Dashboard</h1>
           <p className="text-gray-500 dark:text-gray-400 mt-1">
             Welcome back, <span className="font-bold text-gray-800 dark:text-gray-200">{user?.name}</span>. Here is what's happening today.
           </p>
        </div>
        <Link 
          to="/admin/create" 
          className="flex items-center gap-2 bg-brand-red text-white px-6 py-3 rounded shadow hover:bg-red-700 transition font-bold uppercase tracking-wide text-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Write New Story
        </Link>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
         <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Total Articles</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{articles.length}</p>
            </div>
         </div>

         <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Total Reads</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalViews.toLocaleString()}</p>
            </div>
         </div>

         <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Published</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{publishedCount}</p>
            </div>
         </div>

         <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Drafts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{draftCount}</p>
            </div>
         </div>
      </div>

      {/* ARTICLE TABLE */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
           <h2 className="font-bold text-lg dark:text-white text-gray-800">Recent Content</h2>
        </div>

        {loading ? (
            <div className="p-12 text-center text-gray-500">Loading articles...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 uppercase text-xs font-bold tracking-wider">
                  <tr>
                    <th className="p-4 w-16">Img</th>
                    <th className="p-4">Title & Details</th>
                    <th className="p-4">Category</th>
                    <th className="p-4 text-center">Stats</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {displayedArticles.map(article => (
                    <tr key={article.id} className="group hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                      <td className="p-4">
                        <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0 border dark:border-gray-600">
                          {article.imageUrl ? (
                             <img src={article.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                             <div className="w-full h-full flex items-center justify-center text-gray-400">📷</div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 max-w-md">
                        <Link to={`/admin/edit/${article.id}`} className="block font-bold text-gray-900 dark:text-white mb-1 group-hover:text-brand-red transition-colors line-clamp-1">
                          {article.title}
                        </Link>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                           <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                              {article.author}
                           </span>
                           <span>•</span>
                           <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="p-4">
                         <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                           {article.category}
                         </span>
                      </td>
                      <td className="p-4 text-center">
                         <div className="flex items-center justify-center gap-1 text-sm text-gray-600 dark:text-gray-400 font-medium">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                            {article.views}
                         </div>
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => togglePublish(article)}
                          disabled={!isAdminOrEditor}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide
                            ${article.published 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}
                            ${isAdminOrEditor ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-70'}
                          `}
                        >
                          {article.published ? (
                             <>
                               <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                               Published
                             </>
                          ) : (
                             <>
                               <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5"></span>
                               Draft
                             </>
                          )}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                         <div className="flex items-center justify-end gap-3">
                            <Link to={`/admin/edit/${article.id}`} className="text-gray-400 hover:text-blue-600 transition" title="Edit">
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            </Link>
                            {isAdminOrEditor && (
                              <button onClick={() => handleDelete(article.id)} className="text-gray-400 hover:text-red-600 transition" title="Delete">
                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                              </button>
                            )}
                         </div>
                      </td>
                    </tr>
                  ))}
                  {articles.length === 0 && (
                     <tr><td colSpan={6} className="p-8 text-center text-gray-500">No articles found. Start writing!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
               <Pagination 
                 currentPage={currentPage}
                 totalPages={totalPages}
                 onPageChange={handlePageChange}
               />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
