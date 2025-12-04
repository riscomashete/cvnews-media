
import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { Comment } from '../types';
import { useAuth } from '../context/AuthContext';

const CommentSection: React.FC<{ articleId: string, articleTitle: string }> = ({ articleId, articleTitle }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  
  // States
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reply Form State
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    loadComments();
    if (user) {
      setName(user.name);
    }
  }, [articleId, user]);

  const loadComments = async () => {
    try {
      const data = await db.getComments(articleId);
      setComments(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm("Delete this comment permanently?")) return;
    
    setDeletingId(commentId);
    try {
      await db.deleteComment(commentId);
      // Fix: Update local state instead of re-fetching to prevent cache issues
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (e: any) {
      console.error("Failed to delete comment", e);
      alert(`Error deleting: ${e.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      await db.addComment({
        articleId,
        articleTitle,
        name,
        content,
        isStaff: !!user,
      });
      if (!user) setName('');
      setContent('');
      await loadComments();
    } catch (error: any) {
      alert("Failed to post comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyContent.trim() || !user) return; 

    setSubmitting(true);
    try {
      await db.addComment({
        articleId,
        articleTitle,
        parentId,
        name: user.name,
        content: replyContent,
        isStaff: true,
      });
      setReplyingTo(null);
      setReplyContent('');
      await loadComments();
    } catch (error) {
      alert("Failed to post reply.");
    } finally {
      setSubmitting(false);
    }
  };

  const rootComments = comments.filter(c => !c.parentId);
  const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId).sort((a,b) => a.createdAt - b.createdAt);

  return (
    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
      <h3 className="text-2xl font-bold font-serif mb-6 dark:text-white">Reader Comments ({comments.length})</h3>

      <div className="space-y-8 mb-10">
        {rootComments.map(c => (
          <div key={c.id}>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg relative group">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 dark:text-white">{c.name}</span>
                  {c.isStaff && (
                    <span className="bg-brand-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                      Staff
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{c.content}</p>
              
              {user && (
                <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 flex gap-4">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setReplyingTo(replyingTo === c.id ? null : c.id); }}
                    className="text-xs text-brand-red font-bold uppercase hover:underline flex items-center gap-1"
                  >
                    {replyingTo === c.id ? 'Cancel Reply' : 'Reply'}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                    disabled={deletingId === c.id}
                    className={`text-xs font-bold uppercase flex items-center gap-1 ${deletingId === c.id ? 'text-gray-400 cursor-wait' : 'text-gray-400 hover:text-red-600 hover:underline'}`}
                  >
                    {deletingId === c.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>

            <div className="ml-8 mt-2 space-y-2 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
               {getReplies(c.id).map(reply => (
                  <div key={reply.id} className="bg-gray-100 dark:bg-gray-700/50 p-3 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-gray-800 dark:text-gray-200">{reply.name}</span>
                      {reply.isStaff && (
                        <span className="bg-black dark:bg-gray-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                          Staff Reply
                        </span>
                      )}
                      <span className="text-[10px] text-gray-500 ml-auto">{new Date(reply.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{reply.content}</p>
                    
                    {user && (
                      <div className="mt-2 text-right">
                         <button 
                           onClick={(e) => { e.stopPropagation(); handleDelete(reply.id); }}
                           disabled={deletingId === reply.id}
                           className="text-[10px] text-red-500 hover:text-red-700 font-bold uppercase border border-red-200 px-2 py-0.5 rounded bg-white dark:bg-gray-800"
                         >
                           {deletingId === reply.id ? 'Deleting...' : 'Delete Reply'}
                         </button>
                      </div>
                    )}
                  </div>
               ))}

               {replyingTo === c.id && user && (
                 <form onSubmit={(e) => handleReplySubmit(e, c.id)} className="mt-2 bg-gray-50 dark:bg-gray-900 p-3 border border-brand-red rounded">
                    <label className="block text-xs font-bold uppercase mb-1 text-brand-red">Reply to {c.name}</label>
                    <textarea 
                      className="w-full text-sm p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Write your official response..."
                      rows={2}
                      value={replyContent}
                      onChange={e => setReplyContent(e.target.value)}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button 
                        type="button"
                        onClick={() => setReplyingTo(null)}
                        className="text-xs text-gray-500 hover:text-gray-700 font-bold uppercase"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={submitting}
                        className="bg-brand-red text-white text-xs px-4 py-1 font-bold uppercase rounded hover:opacity-80"
                      >
                        {submitting ? 'Posting...' : 'Post Reply'}
                      </button>
                    </div>
                 </form>
               )}
            </div>
          </div>
        ))}
        {comments.length === 0 && <p className="text-gray-500 italic">No comments yet. Be the first to say something!</p>}
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg shadow-sm">
        <h4 className="font-bold mb-4 dark:text-white">Leave a Comment</h4>
        <form onSubmit={handleSubmit}>
          {!user && (
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase mb-1 dark:text-gray-400">Name</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded"
                required
              />
            </div>
          )}
          {user && (
             <p className="text-sm text-gray-500 mb-2">Posting as <span className="font-bold text-brand-red">{user.name}</span> (Staff)</p>
          )}

          <div className="mb-4">
            <label className="block text-xs font-bold uppercase mb-1 dark:text-gray-400">Comment</label>
            <textarea 
              rows={3}
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={submitting}
            className="bg-brand-red text-white px-6 py-2 font-bold uppercase text-sm hover:bg-red-700 transition disabled:opacity-50"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CommentSection;
