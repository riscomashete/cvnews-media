import React, { useState } from 'react';
import { db } from '../services/db';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    try {
      await db.sendMessage(formData);
      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="grid md:grid-cols-2 gap-12">
        {/* Contact Info */}
        <div>
          <h1 className="text-4xl font-serif font-bold mb-6 dark:text-white">Get in Touch</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
            Have a story tip, advertising inquiry, or just want to say hello? We'd love to hear from you.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-red flex items-center justify-center text-white shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
              </div>
              <div>
                <h3 className="font-bold dark:text-white">Phone / WhatsApp</h3>
                <p className="text-gray-600 dark:text-gray-400">+264 81 123 4567</p>
                <a href="https://wa.me/264811234567" target="_blank" rel="noreferrer" className="text-brand-red text-sm font-bold mt-1 inline-block hover:underline">Chat on WhatsApp →</a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-black dark:bg-gray-700 flex items-center justify-center text-white shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <div>
                <h3 className="font-bold dark:text-white">Email</h3>
                <p className="text-gray-600 dark:text-gray-400">info@cvnews.com.na</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 p-8 shadow-lg border-t-4 border-brand-red">
          {status === 'success' ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h3 className="text-2xl font-bold dark:text-white mb-2">Message Sent!</h3>
              <p className="text-gray-600 dark:text-gray-300">Thank you for contacting us. We will get back to you shortly.</p>
              <button onClick={() => setStatus('idle')} className="mt-6 text-brand-red font-bold hover:underline">Send another message</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2 dark:text-gray-300">Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 rounded-none focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none dark:text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2 dark:text-gray-300">Email</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 rounded-none focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none dark:text-white"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold mb-2 dark:text-gray-300">Message</label>
                <textarea 
                  rows={4} 
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 rounded-none focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none dark:text-white"
                  required
                ></textarea>
              </div>
              {status === 'error' && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm">
                  Failed to send message. Please check your connection or try again later.
                </div>
              )}
              <button 
                type="submit" 
                disabled={status === 'loading'}
                className="w-full bg-black dark:bg-white dark:text-black text-white font-bold py-3 uppercase tracking-wider hover:bg-gray-800 transition disabled:opacity-50"
              >
                {status === 'loading' ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;