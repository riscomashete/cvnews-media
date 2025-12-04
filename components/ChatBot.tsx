import React, { useState, useRef, useEffect } from 'react';
import { createChatSession } from '../services/gemini';
import { Chat, GenerateContentResponse } from "@google/genai";
import { db } from '../services/db';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'model', text: 'Hello! I am the CVNEWS AI Assistant. I can help you find specific articles, answer questions about our company, or summarize the latest news. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const chatSession = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const siteContextRef = useRef<string>('');

  // Initialize Chat with Context
  useEffect(() => {
    const initBot = async () => {
      try {
        // 1. Fetch real site content
        const articles = await db.getArticles();
        const published = articles.filter(a => a.published);

        // 2. Build Context String
        let context = `
        === SYSTEM INFORMATION ===
        Current Date: ${new Date().toDateString()}

        === COMPANY PROFILE ===
        Name: CVNEWS MEDIA CC
        Description: Premier Namibian SME media company bridging the gap between small businesses and the economy.
        Mission: Empowering Namibian entrepreneurs through visibility, connection, and growth.
        Services: Digital Advertising, Corporate Profiling, Event Coverage, Social Media Management.
        Location: Katima Mulilo, Namibia
        Contact: info@cvnews.com.na | +264 81 123 4567
        
        === AVAILABLE NEWS ARTICLES (LATEST FIRST) ===
        `;

        // Add top 100 articles to context (utilizing Gemini's large context window)
        // We include explicit fields for Date and Author to help the AI answer specific queries.
        published.slice(0, 100).forEach(a => {
          context += `
          --------------------------------------------------
          ID: ${a.id}
          Title: "${a.title}"
          Category: ${a.category}
          Author: ${a.author}
          Published: ${new Date(a.createdAt).toDateString()}
          Summary: ${a.excerpt}
          ${a.keywords ? `Keywords: ${a.keywords}` : ''}
          Link: /article/${a.id}
          --------------------------------------------------
          `;
        });

        // Store context for reset
        siteContextRef.current = context;

        // 3. Create Session with Context
        chatSession.current = createChatSession(context);
        
      } catch (error) {
        console.error("Failed to load bot context:", error);
        // Fallback to basic session if DB fails
        chatSession.current = createChatSession("");
      } finally {
        setIsInitializing(false);
      }
    };

    initBot();
  }, []);

  useEffect(() => {
    if (isOpen) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const handleClearChat = () => {
    setMessages([
        { id: Date.now().toString(), role: 'model', text: 'Conversation cleared. How can I help you now?' }
    ]);
    // Re-initialize session with stored context
    chatSession.current = createChatSession(siteContextRef.current);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (isInitializing) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "One moment, I'm just reading the latest headlines to get up to speed..." }]);
        return;
    }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      if (!chatSession.current) {
         // Should not happen if init logic works, but safe fallback
         chatSession.current = createChatSession(siteContextRef.current);
      }

      if (!chatSession.current) {
         setTimeout(() => {
             setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "I'm sorry, I cannot connect to the AI service right now (System Error)." }]);
             setIsTyping(false);
         }, 500);
         return;
      }

      const result = await chatSession.current.sendMessageStream({ message: userMsg.text });
      
      const modelMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: "" }]);

      let fullText = "";
      for await (const chunk of result) {
        const text = (chunk as GenerateContentResponse).text;
        if (text) {
          fullText += text;
          setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: fullText } : m));
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Sorry, I encountered an error connecting to the server. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-transform hover:scale-105 focus:outline-none ${isOpen ? 'bg-gray-800 rotate-90' : 'bg-brand-red'} text-white`}
        aria-label="Toggle AI Chat"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 md:right-6 w-[90vw] md:w-96 h-[500px] max-h-[70vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden z-40 animate-fade-in-up">
          {/* Header */}
          <div className="bg-brand-red text-white p-4 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm">CVNEWS Assistant</h3>
                  <p className="text-xs text-red-100 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isInitializing ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></span> 
                    {isInitializing ? 'Loading Knowledge...' : 'Online'}
                  </p>
                </div>
             </div>
             
             {/* Clear Chat Button */}
             <button 
                onClick={handleClearChat}
                title="Clear Chat History"
                className="p-2 rounded hover:bg-white/20 transition text-white"
             >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
             </button>
          </div>

          {/* Messages */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 scrollbar-thin">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed whitespace-pre-wrap ${
                   msg.role === 'user' 
                     ? 'bg-brand-red text-white rounded-tr-none' 
                     : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-tl-none shadow-sm'
                 }`}>
                   {msg.text}
                 </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg rounded-tl-none border border-gray-200 dark:border-gray-600 shadow-sm flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
             <div className="relative">
               <input 
                 type="text" 
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 placeholder="Type your question..." 
                 className="w-full bg-gray-100 dark:bg-gray-700 border-none rounded-full py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-brand-red dark:text-white"
               />
               <button 
                 type="submit" 
                 disabled={!input.trim() || isTyping}
                 className="absolute right-2 top-2 p-1.5 bg-brand-red text-white rounded-full hover:bg-red-700 disabled:opacity-50 transition"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7"></path></svg>
               </button>
             </div>
             <div className="text-center mt-2">
               <p className="text-[10px] text-gray-400">Powered by Gemini 3.0 Pro</p>
             </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatBot;