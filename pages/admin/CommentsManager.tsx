
import React, { useEffect, useState } from 'react';
import { db } from '../../services/db';
import { Comment } from '../../types';
import { useAuth } from '../../context/AuthContext';

const CommentsManager: React.FC = () => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  // Reply State
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const data = await db.getComments(); // Fetches all comments
    setComments(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this comment permanently? (This will also hide nested replies)")) return;
    
    try {
      await db.deleteComment(id);
      await load();
    } catch (e: any) {
      console.error("Failed to delete comment", e);
      if (e.code !== 'permission-denied') {
          alert("Error: " + e.message);
      }
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentComment: Comment) => {
    e.preventDefault();
    if (!replyContent.trim() || !user) return;

    setSubmitting(true);
    try {
      await db.addComment({
        articleId: parentComment.articleId,
        articleTitle: parentComment.articleTitle, // Keep context
        parentId: parentComment.id, // Link as child
        name: user.name,
        content: replyContent,
        isStaff: true, // Mark as official
      });
      
      // Reset and reload
      setReplyingTo(null);
      setReplyContent('');
      load();
      alert("Reply posted successfully!");
    } catch (error) {
      console.error("Error posting reply:", error);
      alert("Failed to post reply.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 dark:text-white">Comments Moderation</h1>
      
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden border dark:border-gray-700">
        <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
            <h2 className="font-bold dark:text-white">Recent Activity</h2>
            <button onClick={load} className="text-xs text-brand-red font-bold hover:underline">Refresh</button>
        </div>

        {comments.length === 0 ? (
           <div className="p-8 text-center text-gray-500">No comments found.</div>
        ) : (
           <div className="divide-y divide-gray-100 dark:divide-gray-700">
             {comments.map(c => (
                <div key={c.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                   <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col">
                         <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-gray-900 dark:text-white">{c.name}</span>
                            {c.isStaff && (
                              <span className="bg-black text-white text-[10px] px-1.5 rounded uppercase font-bold">Staff</span>
                            )}
                            <span className="text-gray-400 text-xs">•</span>
                            <span className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</span>
                         </div>
                         <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-brand-red font-bold bg-red-50 dark:bg-red-900/30 px-1.5 rounded">
                                Art: {c.articleTitle || 'Unknown Article'}
                            </span>
                            {c.parentId && (
                                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 rounded">
                                   ↳ In reply to a comment
                                </span>
                            )}
                         </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                              setReplyingTo(replyingTo === c.id ? null : c.id);
                              setReplyContent('');
                          }}
                          className="text-blue-600 text-xs font-bold border border-blue-200 bg-blue-50 px-3 py-1 rounded hover:bg-blue-100"
                        >
                          {replyingTo === c.id ? 'Cancel' : 'Reply'}
                        </button>
                        <button 
                          onClick={() => handleDelete(c.id)}
                          className="text-red-600 text-xs font-bold border border-red-200 bg-red-50 px-3 py-1 rounded hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                   </div>
                   
                   <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900 p-3 rounded mt-2">
                      {c.content}
                   </p>

                   {/* Admin Reply Form */}
                   {replyingTo === c.id && (
                     <form onSubmit={(e) => handleReplySubmit(e, c)} className="mt-4 ml-4 pl-4 border-l-2 border-brand-red">
                        <label className="block text-xs font-bold uppercase mb-1 dark:text-gray-300">
                           Replying as <span className="text-brand-red">{user?.name}</span>
                        </label>
                        <textarea 
                           className="w-full border p-2 text-sm rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-1 focus:ring-brand-red outline-none"
                           rows={3}
                           placeholder="Type your official response here..."
                           value={replyContent}
                           onChange={e => setReplyContent(e.target.value)}
                           autoFocus
                           required
                        />
                        <div className="mt-2 flex justify-end">
                           <button 
                              type="submit" 
                              disabled={submitting}
                              className="bg-brand-red text-white text-xs font-bold uppercase px-4 py-2 rounded hover:opacity-80 disabled:opacity-50"
                           >
                              {submitting ? 'Posting...' : 'Post Reply'}
                           </button>
                        </div>
                     </form>
                   )}
                </div>
             ))}
           </div>
        )}
      </div>
    </div>
  );
};

export default CommentsManager;
