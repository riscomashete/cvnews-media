
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/db';
import { Advertisement } from '../types';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [globalError, setGlobalError] = useState('');
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Ticker State
  const [tickerMsg, setTickerMsg] = useState('');

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isActive = (path: string) => location.pathname === path ? 'text-brand-red font-bold' : 'hover:text-brand-red';
  const isAdminActive = (path: string) => location.pathname === path ? 'text-white font-bold border-b-2 border-brand-red' : 'text-gray-400 hover:text-white transition-colors';

  React.useEffect(() => {
    const handleError = () => {
      setGlobalError('Database permissions are locked. Features may be limited. Please update Firebase Rules.');
    };
    window.addEventListener('firestore-permission-error', handleError);
    return () => window.removeEventListener('firestore-permission-error', handleError);
  }, []);

  // Fetch latest announcement for Top Ticker
  useEffect(() => {
    const fetchTicker = async () => {
      const ads = await db.getAds();
      const announcements = ads.filter(a => a.type === 'announcement' && a.active);
      if (announcements.length > 0) {
        setTickerMsg(announcements[0].title + ': ' + (announcements[0].content || ''));
      }
    };
    fetchTicker();
  }, [location.pathname]); // Refresh on navigation

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Global Error Banner */}
      {globalError && (
        <div className="bg-red-600 text-white text-center p-2 text-sm font-bold">
          ⚠️ SYSTEM ALERT: {globalError} (Running in Offline Mode)
        </div>
      )}

      {/* Breaking News Ticker (Only show on public pages) */}
      {!isAdminRoute && tickerMsg && (
        <div className="bg-black text-white text-xs py-2 overflow-hidden relative">
          <div className="container mx-auto px-4 flex items-center">
            <span className="bg-brand-red px-2 py-0.5 font-bold uppercase mr-3 shrink-0 text-[10px] tracking-wider">Breaking</span>
            <div className="whitespace-nowrap overflow-hidden w-full">
               <span className="inline-block animate-marquee">{tickerMsg}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className="bg-white dark:bg-brand-dark border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="bg-brand-red text-white p-1 font-bold text-xl tracking-tighter">CV</div>
            <span className="text-xl font-bold tracking-wide dark:text-white hidden sm:block">NEWS MEDIA</span>
          </Link>

          {/* Desktop Nav (Public Links) */}
          <nav className="hidden md:flex items-center gap-6 text-sm uppercase tracking-wider font-medium text-gray-700 dark:text-gray-300">
            <Link to="/" className={isActive('/')}>Home</Link>
            <Link to="/directory" className={isActive('/directory')}>Directory</Link>
            <Link to="/about" className={isActive('/about')}>About</Link>
            <Link to="/contact" className={isActive('/contact')}>Contact</Link>
            
            {user && (
              <>
                <div className="w-px h-4 bg-gray-300 mx-2"></div>
                <Link to="/admin" className={`font-bold ${isAdminRoute ? 'text-brand-red' : 'text-gray-700 dark:text-gray-300 hover:text-brand-red'}`}>
                  Dashboard
                </Link>
              </>
            )}
          </nav>

          {/* Actions & Search */}
          <div className="hidden md:flex items-center gap-4">
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative">
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-gray-100 dark:bg-gray-800 border-none rounded-full py-1 pl-4 pr-8 text-sm focus:ring-1 focus:ring-brand-red w-32 focus:w-48 transition-all dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="absolute right-2 top-1.5 text-gray-400 hover:text-brand-red">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </button>
            </form>

            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="Toggle Dark Mode"
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
              ) : (
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              )}
            </button>

            {user ? (
              <button onClick={logout} className="text-sm font-medium hover:text-brand-red dark:text-gray-300">Logout</button>
            ) : (
              <Link to="/login" className="bg-black dark:bg-white dark:text-black text-white px-4 py-2 text-sm font-bold uppercase hover:opacity-80 transition">
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-gray-700 dark:text-gray-200"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path></svg>
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="p-4 border-b dark:border-gray-800">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search articles..." 
                  className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded py-2 pl-4 pr-10 text-sm focus:ring-1 focus:ring-brand-red dark:text-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="absolute right-3 top-2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </button>
              </div>
            </form>

            <nav className="flex flex-col p-4 gap-4 text-center">
              <Link to="/" className="py-2 hover:text-brand-red dark:text-gray-300" onClick={() => setIsMenuOpen(false)}>Home</Link>
              <Link to="/directory" className="py-2 hover:text-brand-red dark:text-gray-300" onClick={() => setIsMenuOpen(false)}>SME Directory</Link>
              <Link to="/about" className="py-2 hover:text-brand-red dark:text-gray-300" onClick={() => setIsMenuOpen(false)}>About</Link>
              <Link to="/contact" className="py-2 hover:text-brand-red dark:text-gray-300" onClick={() => setIsMenuOpen(false)}>Contact</Link>
              
              {user && (
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mt-2">
                  <h4 className="text-xs font-bold uppercase text-gray-500 mb-3">Admin Panel</h4>
                  <div className="flex flex-col gap-2">
                    <Link to="/admin" className="font-bold text-brand-red" onClick={() => setIsMenuOpen(false)}>Overview</Link>
                    <Link to="/admin/messages" className="text-gray-700 dark:text-gray-300" onClick={() => setIsMenuOpen(false)}>Messages</Link>
                    <Link to="/admin/ads" className="text-gray-700 dark:text-gray-300" onClick={() => setIsMenuOpen(false)}>Ads Manager</Link>
                    <Link to="/admin/directory" className="text-gray-700 dark:text-gray-300" onClick={() => setIsMenuOpen(false)}>Biz Directory</Link>
                    <Link to="/admin/events" className="text-gray-700 dark:text-gray-300" onClick={() => setIsMenuOpen(false)}>Events</Link>
                    <Link to="/admin/comments" className="text-gray-700 dark:text-gray-300" onClick={() => setIsMenuOpen(false)}>Comments</Link>
                    {user.role === 'admin' && <Link to="/admin/users" className="text-gray-700 dark:text-gray-300" onClick={() => setIsMenuOpen(false)}>Users</Link>}
                  </div>
                </div>
              )}

              <div className="border-t pt-4 flex flex-col gap-3">
                 <button onClick={() => { toggleTheme(); setIsMenuOpen(false); }} className="text-sm dark:text-gray-300">Toggle Theme</button>
                 {user ? <button onClick={logout} className="text-brand-red font-bold">Logout</button> : <Link to="/login" onClick={() => setIsMenuOpen(false)} className="font-bold dark:text-white">Sign In</Link>}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ADMIN TOOLBAR - Visible only on Admin Routes */}
      {user && isAdminRoute && (
        <div className="bg-gray-900 text-white border-b border-gray-800 sticky top-16 z-40 shadow-md">
          <div className="container mx-auto px-4 overflow-x-auto">
             <div className="flex items-center h-12 gap-6 whitespace-nowrap text-sm">
                <span className="text-gray-500 font-bold text-xs uppercase tracking-widest hidden md:inline">Admin Tools:</span>
                
                <Link to="/admin" className={isAdminActive('/admin')}>
                   Overview
                </Link>

                <Link to="/admin/create" className={isAdminActive('/admin/create')}>
                   + Write Story
                </Link>

                <Link to="/admin/messages" className={isAdminActive('/admin/messages')}>
                   Messages
                </Link>

                <Link to="/admin/comments" className={isAdminActive('/admin/comments')}>
                   Comments
                </Link>

                <Link to="/admin/ads" className={isAdminActive('/admin/ads')}>
                   Ads & Announcements
                </Link>

                <Link to="/admin/directory" className={isAdminActive('/admin/directory')}>
                   Directory
                </Link>

                <Link to="/admin/events" className={isAdminActive('/admin/events')}>
                   Events
                </Link>

                {user.role === 'admin' && (
                  <Link to="/admin/users" className={isAdminActive('/admin/users')}>
                     Staff Users
                  </Link>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-black text-white py-12 border-t-4 border-brand-red">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-brand-red text-white p-1 font-bold text-lg">CV</div>
              <span className="text-lg font-bold tracking-wide">NEWS MEDIA</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Empowering Namibia through impactful storytelling and digital innovation. 
              The pulse of the SME sector.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-gray-200">Quick Links</h3>
            <ul className="text-gray-400 text-sm space-y-2">
              <li><Link to="/directory" className="hover:text-white transition">Business Directory</Link></li>
              <li><Link to="/about" className="hover:text-white transition">Mission & Vision</Link></li>
              <li><Link to="/contact" className="hover:text-white transition">Advertise with Us</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Staff Portal</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-gray-200">Contact</h3>
            <p className="text-gray-400 text-sm mb-2">Katima Mulilo, Namibia</p>
            <p className="text-gray-400 text-sm mb-2">info@cvnews.com.na</p>
            
            {/* Social Media Icons */}
            <div className="flex gap-4 mt-4">
               {/* Facebook */}
               <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#1877F2] transition text-white" aria-label="Facebook">
                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
               </a>
               
               {/* X / Twitter */}
               <a href="https://x.com" target="_blank" rel="noreferrer" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-black transition text-white" aria-label="X (Twitter)">
                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
               </a>
               
               {/* Instagram */}
               <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-red-500 hover:to-purple-500 transition text-white" aria-label="Instagram">
                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
               </a>
            </div>
          </div>
        </div>
        
        {/* Copyright & Credits */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-center items-center text-center gap-6 text-xs text-gray-500">
          <div>
            &copy; {new Date().getFullYear()} CVNEWS MEDIA CC. All rights reserved.
          </div>
          <div className="flex items-center gap-1">
             <span>Website created by</span>
             <a 
               href="https://www.riscomashete.com" 
               target="_blank" 
               rel="noreferrer"
               className="text-gray-400 hover:text-brand-red font-bold transition-colors"
             >
               Risco Mashete
             </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
