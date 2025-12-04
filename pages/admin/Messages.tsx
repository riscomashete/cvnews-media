
import React, { useEffect, useState } from 'react';
import { db } from '../../services/db';
import { ContactMessage } from '../../types';

const Messages: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Interaction States
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const data = await db.getMessages();
      setMessages(data);
    } catch (e) {
      console.error("Failed to load messages", e);
      setStatusMsg({ type: 'error', text: 'Failed to load messages.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this message? This action cannot be undone.")) return;
    
    setDeletingId(id);
    setStatusMsg(null);

    try {
      await db.deleteMessage(id);
      
      // CRITICAL FIX: Update local state immediately instead of re-fetching.
      // Re-fetching often hits the Firebase cache which might still contain the deleted item.
      setMessages(prev => prev.filter(msg => msg.id !== id));
      
      setStatusMsg({ type: 'success', text: 'Message deleted successfully.' });
    } catch (error: any) {
      console.error("Delete failed", error);
      setStatusMsg({ type: 'error', text: `Delete failed: ${error.message}` });
    } finally {
      setDeletingId(null);
      // Clear status after 3 seconds
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
         <h1 className="text-3xl font-bold dark:text-white">Inbox</h1>
         <button 
           onClick={() => loadMessages()} 
           className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded text-sm font-bold hover:bg-gray-200 transition"
         >
           Refresh List
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

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border dark:border-gray-700">
        {loading ? (
             <div className="p-12 text-center text-gray-500">Loading messages...</div>
        ) : messages.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                <svg className="w-12 h-12 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                <p>No messages in inbox.</p>
            </div>
        ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {messages.map(msg => (
                    <div key={msg.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition duration-150">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 gap-4">
                            <div>
                                <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                                  {msg.name}
                                  <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">New Message</span>
                                </h3>
                                <a href={`mailto:${msg.email}`} className="text-sm text-blue-600 hover:underline">{msg.email}</a>
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(msg.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded mb-4 border border-gray-100 dark:border-gray-700">
                           <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                               {msg.message}
                           </p>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <a 
                                href={`mailto:${msg.email}?subject=Re: Inquiry via CVNEWS&body=\n\n> ${msg.message}`}
                                className="px-4 py-2 bg-black dark:bg-white dark:text-black text-white text-sm font-bold uppercase rounded hover:opacity-80 transition shadow-sm"
                            >
                                Reply via Email
                            </a>
                            <button 
                                onClick={() => handleDelete(msg.id)}
                                disabled={deletingId === msg.id}
                                className={`px-4 py-2 text-sm font-bold uppercase rounded border transition shadow-sm flex items-center gap-2 ${
                                    deletingId === msg.id 
                                    ? 'bg-red-50 text-red-400 border-red-100 cursor-not-allowed' 
                                    : 'bg-white dark:bg-gray-800 text-red-600 border-gray-200 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                                }`}
                            >
                                {deletingId === msg.id ? (
                                  <>
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                                    Deleting...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                    Delete
                                  </>
                                )}
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
