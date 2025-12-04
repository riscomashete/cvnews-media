import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { Business } from '../types';
import Pagination from '../components/Pagination';

const ITEMS_PER_PAGE = 9;

const Directory: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [category, setCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      const data = await db.getBusinesses();
      setBusinesses(data);
      setLoading(false);
    };
    load();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, category]);

  const categories = Array.from(new Set(businesses.map(b => b.category)));

  const filtered = businesses.filter(b => {
    const matchName = b.name.toLowerCase().includes(filter.toLowerCase()) || 
                      b.description.toLowerCase().includes(filter.toLowerCase());
    const matchCat = category ? b.category === category : true;
    return matchName && matchCat;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const displayedBusinesses = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif font-bold mb-4 dark:text-white">SME Business Directory</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Discover Namibia's thriving small businesses. From services to retail, find trusted local partners here.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mb-8 flex flex-col md:flex-row gap-4">
        <input 
          type="text" 
          placeholder="Search businesses..." 
          className="flex-grow p-3 border dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <select 
          className="p-3 border dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded md:w-1/4"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20">Loading directory...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedBusinesses.map(b => (
              <div key={b.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow hover:shadow-lg transition p-6 flex flex-col">
                <div className="h-24 flex items-center mb-4">
                  {b.logoUrl ? (
                    <img src={b.logoUrl} alt={b.name} className="max-h-full max-w-[150px] object-contain" />
                  ) : (
                    <div className="w-16 h-16 bg-brand-red text-white flex items-center justify-center font-bold text-xl rounded">
                      {b.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="mb-2">
                   <span className="text-xs font-bold uppercase text-brand-red bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded">
                     {b.category}
                   </span>
                </div>
                <h3 className="text-xl font-bold mb-2 dark:text-white">{b.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 flex-grow">
                  {b.description}
                </p>
                
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 text-sm space-y-2">
                   <div className="flex items-center gap-2 dark:text-gray-300">
                      <span className="font-bold w-12">Email:</span>
                      <a href={`mailto:${b.contactEmail}`} className="hover:text-brand-red truncate">{b.contactEmail}</a>
                   </div>
                   <div className="flex items-center gap-2 dark:text-gray-300">
                      <span className="font-bold w-12">Tel:</span>
                      <a href={`tel:${b.contactPhone}`} className="hover:text-brand-red">{b.contactPhone}</a>
                   </div>
                   {b.website && (
                      <div className="mt-3">
                         <a 
                           href={b.website} 
                           target="_blank" 
                           rel="noreferrer" 
                           className="block text-center bg-black dark:bg-white dark:text-black text-white py-2 text-xs font-bold uppercase hover:opacity-80 transition"
                         >
                           Visit Website
                         </a>
                      </div>
                   )}
                </div>
              </div>
            ))}
          </div>
          {filtered.length > 0 && (
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
          {filtered.length === 0 && (
             <div className="col-span-3 text-center py-12 text-gray-500">No businesses found matching your criteria.</div>
          )}
        </>
      )}
    </div>
  );
};

export default Directory;