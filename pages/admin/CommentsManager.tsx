
import React, { useEffect, useState } from 'react';
import { db } from '../../services/db';
import { Comment } from '../../types';
import { useAuth } from '../../context/AuthContext';

const CommentsManager: React.FC = () => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Transactional States
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Reply State
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await db.getComments();
      setComments(data);
    } catch (error) {
      console.error(error);
      setStatusMsg({ type: 'error', text: 'Failed to fetch comments.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this comment permanently?")) return;
    
    setDeletingId(id);
    setStatusMsg(null);
    try {
      await db.deleteComment(id);
      
      // CRITICAL FIX: Manually remove from state to reflect instant deletion.
      setComments(prev => prev.filter(c => c.id !== id));
      
      setStatusMsg({ type: 'success', text: 'Comment deleted.' });
    } catch (e: any) {
      console.error("Failed to delete comment", e);
      setStatusMsg({ type: 'error', text: `Error deleting: ${e.message}` });
    } finally {
      setDeletingId(null);
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentComment: Comment) => {
    e.preventDefault();
    if (!replyContent.trim() || !user) return;

    setSubmitting(true);
    try {
      await db.addComment({
        articleId: parentComment.articleId,
        articleTitle: parentComment.articleTitle,
        parentId: parentComment.id,
        name: user.name,
        content: replyContent,
        isStaff: true,
      });
      
      setReplyingTo(null);
      setReplyContent('');
      setStatusMsg({ type: 'success', text: 'Reply posted.' });
      
      // For adding, re-fetching is usually okay because it's a new item, 
      // but we can also just append it if we returned the new object from db.ts.
      // We will stick to loadComments for additions.
      await loadComments();
    } catch (error: any) {
      console.error("Error posting reply:", error);
      setStatusMsg({ type: 'error', text: 'Failed to post reply.' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold dark:text-white">Comments</h1>
        <button onClick={() => loadComments()} className="text-sm font-bold text-brand-red hover:underline">
           Refresh Data
        </button>
      </div>
      
      {/* Status Banner */}
      {statusMsg && (
        <div className={`mb-6 p-4 rounded text-sm font-bold ${
          statusMsg.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {statusMsg.text}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden border dark:border-gray-700 rounded-lg">
        {loading ? (
             <div className="p-12 text-center text-gray-500">Loading comments...</div>
        ) : comments.length === 0 ? (
           <div className="p-12 text-center text-gray-500">No comments found.</div>
        ) : (
           <div className="divide-y divide-gray-100 dark:divide-gray-700">
             {comments.map(c => (
                <div key={c.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
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
                            {c.articleTitle && (
                                <span className="text-xs text-brand-red font-bold bg-red-50 dark:bg-red-900/30 px-1.5 rounded truncate max-w-[200px]">
                                    {c.articleTitle}
                                </span>
                            )}
                            {c.parentId && (
                                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 rounded">
                                   ↳ Reply
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
                          disabled={deletingId === c.id}
                          className={`text-xs font-bold border px-3 py-1 rounded transition flex items-center gap-1 ${
                              deletingId === c.id 
                              ? 'text-red-400 border-red-100 bg-red-50 cursor-wait'
                              : 'text-red-600 border-red-200 bg-red-50 hover:bg-red-100'
                          }`}
                        >
                          {deletingId === c.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                   </div>
                   
                   <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900 p-3 rounded mt-2 border border-gray-100 dark:border-gray-800">
                      {c.content}
                   </p>

                   {/* Admin Reply Form */}
                   {replyingTo === c.id && (
                     <form onSubmit={(e) => handleReplySubmit(e, c)} className="mt-4 ml-4 pl-4 border-l-2 border-brand-red animate-fade-in">
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
