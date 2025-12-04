import React, { useEffect, useState } from 'react';
import { db } from '../../services/db';
import { ContactMessage } from '../../types';

const Messages: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    const data = await db.getMessages();
    setMessages(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this message?")) {
      await db.deleteMessage(id);
      loadMessages();
    }
  };

  if (loading) return <div className="p-8 text-center">Loading messages...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 dark:text-white">Inbox</h1>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border dark:border-gray-700">
        {messages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No messages found.</div>
        ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {messages.map(msg => (
                    <div key={msg.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-lg dark:text-white">{msg.name}</h3>
                                <a href={`mailto:${msg.email}`} className="text-sm text-blue-600 hover:underline">{msg.email}</a>
                            </div>
                            <span className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-4 rounded mb-4 whitespace-pre-wrap">
                            {msg.message}
                        </p>
                        <div className="flex gap-3">
                            <a 
                                href={`mailto:${msg.email}?subject=Re: Inquiry via CVNEWS&body=\n\n> ${msg.message}`}
                                className="px-4 py-2 bg-black dark:bg-white dark:text-black text-white text-sm font-bold uppercase rounded hover:opacity-80"
                            >
                                Reply
                            </a>
                            <button 
                                onClick={() => handleDelete(msg.id)}
                                className="px-4 py-2 text-red-600 text-sm font-bold uppercase hover:bg-red-50 dark:hover:bg-gray-700 rounded"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default Messages;