import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../services/db';
import { Article } from '../../types';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../../components/Pagination';

const ITEMS_PER_PAGE = 10;

const Dashboard: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const { user, isAdminOrEditor } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    const data = await db.getArticles();
    setArticles(data);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      await db.deleteArticle(id);
      loadArticles();
    }
  };

  const togglePublish = async (article: Article) => {
    if (!isAdminOrEditor) return;
    await db.updateArticle(article.id, { published: !article.published });
    loadArticles();
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-bold dark:text-white">Dashboard</h1>
           <p className="text-gray-500 dark:text-gray-400 text-sm">Welcome back, {user?.name} ({user?.role})</p>
        </div>
        <Link to="/admin/create" className="bg-brand-red text-white px-4 py-2 font-bold hover:bg-red-700">
          + New Article
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 uppercase text-xs">
            <tr>
              <th className="p-4">Status</th>
              <th className="p-4">Title</th>
              <th className="p-4">Author</th>
              <th className="p-4">Views</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {displayedArticles.map(article => (
              <tr key={article.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                <td className="p-4">
                  <span 
                    onClick={() => togglePublish(article)}
                    className={`px-2 py-1 text-xs font-bold rounded ${
                      article.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    } ${isAdminOrEditor ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-70'}`}
                    title={isAdminOrEditor ? "Click to toggle status" : "Only Editors can publish"}
                  >
                    {article.published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="p-4 font-medium dark:text-white">{article.title}</td>
                <td className="p-4 text-sm text-gray-500 dark:text-gray-400">{article.author}</td>
                <td className="p-4 text-sm text-gray-500 dark:text-gray-400">{article.views}</td>
                <td className="p-4 text-right space-x-2">
                  <Link to={`/admin/edit/${article.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-bold">Edit</Link>
                  {isAdminOrEditor && (
                    <button onClick={() => handleDelete(article.id)} className="text-red-600 hover:text-red-800 text-sm font-bold">Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default Dashboard;