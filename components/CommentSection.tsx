
import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { Comment } from '../types';
import { useAuth } from '../context/AuthContext';

const CommentSection: React.FC<{ articleId: string, articleTitle: string }> = ({ articleId, articleTitle }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  
  // New Comment Form State
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reply Form State
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    loadComments();
    if (user) {
      setName(user.name); // Auto-fill name for staff
    }
  }, [articleId, user]);

  const loadComments = async () => {
    const data = await db.getComments(articleId);
    setComments(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;

    setSubmitting(true);
    await db.addComment({
      articleId,
      articleTitle,
      name,
      content,
      isStaff: !!user, // Mark as staff if logged in
    });
    setSubmitting(false);
    if (!user) setName(''); // Only clear name if guest
    setContent('');
    loadComments();
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    
    // Safety check: Only staff can use this form in UI, but double check user exists
    if (!user) return; 

    setSubmitting(true);
    await db.addComment({
      articleId,
      articleTitle,
      parentId,
      name: user.name,
      content: replyContent,
      isStaff: true,
    });
    setSubmitting(false);
    setReplyingTo(null);
    setReplyContent('');
    loadComments();
  };

  // Group comments: Roots vs Replies
  const rootComments = comments.filter(c => !c.parentId);
  const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId).sort((a,b) => a.createdAt - b.createdAt);

  return (
    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
      <h3 className="text-2xl font-bold font-serif mb-6 dark:text-white">Reader Comments ({comments.length})</h3>

      {/* List */}
      <div className="space-y-8 mb-10">
        {rootComments.map(c => (
          <div key={c.id}>
            {/* Parent Comment */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg relative">
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
              
              {/* Staff Reply Button */}
              {user && (
                <button 
                  onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                  className="text-xs text-brand-red font-bold mt-2 hover:underline"
                >
                  {replyingTo === c.id ? 'Cancel Reply' : 'Reply'}
                </button>
              )}
            </div>

            {/* Nested Replies */}
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
                  </div>
               ))}

               {/* Reply Form */}
               {replyingTo === c.id && user && (
                 <form onSubmit={(e) => handleReplySubmit(e, c.id)} className="mt-2">
                    <textarea 
                      className="w-full text-sm p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Write a reply..."
                      rows={2}
                      value={replyContent}
                      onChange={e => setReplyContent(e.target.value)}
                      autoFocus
                    />
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="mt-1 bg-black text-white text-xs px-3 py-1 font-bold uppercase rounded hover:opacity-80"
                    >
                      {submitting ? 'Posting...' : 'Post Reply'}
                    </button>
                 </form>
               )}
            </div>
          </div>
        ))}
        {comments.length === 0 && <p className="text-gray-500 italic">No comments yet. Be the first to say something!</p>}
      </div>

      {/* Main Comment Form */}
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
