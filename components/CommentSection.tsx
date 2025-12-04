
import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { Comment } from '../types';

const CommentSection: React.FC<{ articleId: string, articleTitle: string }> = ({ articleId, articleTitle }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [articleId]);

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
      articleTitle, // Save title for easier admin context
      name,
      content
    });
    setSubmitting(false);
    setName('');
    setContent('');
    loadComments();
  };

  return (
    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
      <h3 className="text-2xl font-bold font-serif mb-6 dark:text-white">Reader Comments ({comments.length})</h3>

      {/* List */}
      <div className="space-y-6 mb-10">
        {comments.map(c => (
          <div key={c.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-gray-900 dark:text-white">{c.name}</span>
              <span className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{c.content}</p>
          </div>
        ))}
        {comments.length === 0 && <p className="text-gray-500 italic">No comments yet. Be the first to say something!</p>}
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg shadow-sm">
        <h4 className="font-bold mb-4 dark:text-white">Leave a Reply</h4>
        <form onSubmit={handleSubmit}>
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
            className="bg-black dark:bg-white dark:text-black text-white px-6 py-2 font-bold uppercase text-sm hover:opacity-80 transition disabled:opacity-50"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CommentSection;
