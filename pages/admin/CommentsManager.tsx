
import React, { useEffect, useState } from 'react';
import { db } from '../../services/db';
import { Comment } from '../../types';

const CommentsManager: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const data = await db.getComments(); // Fetches all comments
    setComments(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this comment permanently?")) {
      await db.deleteComment(id);
      load();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 dark:text-white">Comments Moderation</h1>
      
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden border dark:border-gray-700">
        <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
            <h2 className="font-bold dark:text-white">Recent Reader Comments</h2>
            <button onClick={load} className="text-xs text-brand-red font-bold hover:underline">Refresh</button>
        </div>

        {comments.length === 0 ? (
           <div className="p-8 text-center text-gray-500">No comments found.</div>
        ) : (
           <div className="divide-y divide-gray-100 dark:divide-gray-700">
             {comments.map(c => (
                <div key={c.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                   <div className="flex justify-between items-start mb-2">
                      <div>
                         <span className="font-bold text-sm text-gray-900 dark:text-white">{c.name}</span>
                         <span className="text-gray-400 text-xs mx-2">•</span>
                         <span className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</span>
                         <div className="text-xs text-brand-red mt-1 font-bold">
                            On: {c.articleTitle || 'Article'}
                         </div>
                      </div>
                      <button 
                        onClick={() => handleDelete(c.id)}
                        className="text-red-600 text-xs font-bold border border-red-200 bg-red-50 px-2 py-1 rounded hover:bg-red-100"
                      >
                        Delete
                      </button>
                   </div>
                   <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900 p-3 rounded">
                      {c.content}
                   </p>
                </div>
             ))}
           </div>
        )}
      </div>
    </div>
  );
};

export default CommentsManager;
