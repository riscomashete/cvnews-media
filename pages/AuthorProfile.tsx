
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../services/db';
import { Article, User } from '../types';
import ArticleCard from '../components/ArticleCard';
import Pagination from '../components/Pagination';

const ITEMS_PER_PAGE = 9;

const AuthorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [author, setAuthor] = useState<User | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      
      const profile = await db.getPublicUserProfile(id);
      if (profile) {
        setAuthor(profile);
        // Use AuthorID for reliable fetching
        const authorArticles = await db.getArticlesByAuthorId(profile.uid);
        setArticles(authorArticles.filter(a => a.published));
      }
      
      setLoading(false);
    };
    load();
  }, [id]);

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

  if (loading) return <div className="p-20 text-center dark:text-white">Loading profile...</div>;
  if (!author) return <div className="p-20 text-center dark:text-white">Author not found.</div>;

  return (
    <div className="container mx-auto px-4 py-12">
       {/* Profile Header */}
       <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-center gap-8 max-w-4xl mx-auto mb-16">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg flex-shrink-0">
             {author.avatarUrl ? (
                <img src={author.avatarUrl} alt={author.name} className="w-full h-full object-cover" />
             ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">👤</div>
             )}
          </div>
          <div className="text-center md:text-left">
             <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
               <h1 className="text-3xl font-bold font-serif dark:text-white">{author.name}</h1>
               {/* Display custom Job Title or fallback to generic Role */}
               <span className="bg-brand-red text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                 {author.jobTitle || (author.role === 'admin' ? 'Editor-in-Chief' : 'Journalist')}
               </span>
             </div>
             {author.bio ? (
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg">
                   {author.bio}
                </p>
             ) : (
                <p className="text-gray-400 italic">No bio available.</p>
             )}
             <div className="mt-4 flex gap-4 justify-center md:justify-start text-sm text-gray-500">
                <span>Joined CVNEWS Team</span>
                {author.email && (
                  <>
                   <span>•</span>
                   <a href={`mailto:${author.email}`} className="text-blue-500 hover:underline">Contact Author</a>
                  </>
                )}
             </div>
          </div>
       </div>

       {/* Articles Grid */}
       <div className="border-t border-gray-200 dark:border-gray-800 pt-12">
          <h2 className="text-2xl font-bold mb-8 dark:text-white flex items-center gap-2">
             <span className="w-2 h-8 bg-brand-red rounded-sm"></span>
             Articles by {author.name} <span className="text-gray-400 text-lg font-normal">({articles.length})</span>
          </h2>
          
          {articles.length > 0 ? (
             <>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
             <p className="text-center text-gray-500 py-12">
               No published stories found. Check back soon for updates from {author.name}.
             </p>
          )}
       </div>
    </div>
  );
};

export default AuthorProfile;
