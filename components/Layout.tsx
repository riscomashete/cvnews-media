
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/db';
import { Advertisement } from '../types';
import ChatBot from './ChatBot';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  
  // Public Menu State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Admin Sidebar State
  const [isAdminSidebarOpen, setIsAdminSidebarOpen] = useState(false);

  const [globalError, setGlobalError] = useState('');
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Ticker State
  const [tickerMsg, setTickerMsg] = useState('');

  // Date & Time State
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isActive = (path: string) => location.pathname === path ? 'text-brand-red font-bold' : 'hover:text-brand-red';

  React.useEffect(() => {
    const handleError = () => {
      setGlobalError('Database permissions are locked. Features may be limited. Please update Firebase Rules.');
    };
    window.addEventListener('firestore-permission-error', handleError);
    return () => window.removeEventListener('firestore-permission-error', handleError);
  }, []);

  // Clock Timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Date Formatting based on User Locale
  const dateStr = currentDateTime.toLocaleDateString(undefined, { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const timeStr = currentDateTime.toLocaleTimeString(undefined, { 
    hour: '2-digit', 
    minute: '2-digit'
  });

  // Get User Location from Timezone
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // Format "Africa/Windhoek" to "Windhoek"
  const locationName = timeZone.includes('/') ? timeZone.split('/')[1].replace(/_/g, ' ') : timeZone;

  // Fetch latest announcement for Top Ticker (Public Only)
  useEffect(() => {
    if (isAdminRoute) return;
    const fetchTicker = async () => {
      const ads = await db.getAds();
      const announcements = ads.filter(a => a.type === 'announcement' && a.active);
      if (announcements.length > 0) {
        setTickerMsg(announcements[0].title + ': ' + (announcements[0].content || ''));
      }
    };
    fetchTicker();
  }, [location.pathname, isAdminRoute]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsMenuOpen(false);
    }
  };

  // ----------------------------------------------------------------------
  // ADMIN LAYOUT
  // ----------------------------------------------------------------------
  if (user && isAdminRoute) {
    const AdminLink = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => {
      const active = location.pathname === to;
      return (
        <Link 
          to={to} 
          onClick={() => setIsAdminSidebarOpen(false)}
          className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors border-l-4 ${
            active 
              ? 'bg-gray-800 text-brand-red border-brand-red' 
              : 'text-gray-400 hover:bg-gray-800 hover:text-white border-transparent'
          }`}
        >
          {icon}
          <span>{label}</span>
        </Link>
      );
    };

    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {isAdminSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsAdminSidebarOpen(false)}
          ></div>
        )}

        {/* SIDEBAR */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-gray-300 transition-transform duration-300 ease-in-out
          md:translate-x-0 md:static flex flex-col shadow-2xl
          ${isAdminSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {/* Sidebar Header */}
          <div className="h-16 flex items-center px-6 bg-black text-white font-bold tracking-wider text-xl shadow-md shrink-0">
             <span className="text-brand-red mr-1">CV</span>ADMIN
          </div>

          {/* Nav Links */}
          <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
             <div className="px-6 mb-2 text-xs font-bold text-gray-500 uppercase tracking-widest">Content</div>
             <AdminLink to="/admin" label="Overview" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>} />
             <AdminLink to="/admin/create" label="Write Story" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>} />
             
             <div className="px-6 mt-6 mb-2 text-xs font-bold text-gray-500 uppercase tracking-widest">Community</div>
             <AdminLink to="/admin/messages" label="Messages" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>} />
             <AdminLink to="/admin/comments" label="Comments" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path></svg>} />
             
             <div className="px-6 mt-6 mb-2 text-xs font-bold text-gray-500 uppercase tracking-widest">Management</div>
             <AdminLink to="/admin/ads" label="Ads & Tickers" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>} />
             <AdminLink to="/admin/directory" label="Directory" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>} />
             <AdminLink to="/admin/events" label="Events" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>} />
             
             {user.role === 'admin' && (
                <>
                  <div className="px-6 mt-6 mb-2 text-xs font-bold text-gray-500 uppercase tracking-widest">System</div>
                  <AdminLink to="/admin/users" label="Staff Users" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>} />
                </>
             )}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 bg-gray-950 border-t border-gray-800 shrink-0">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-brand-red flex items-center justify-center text-white font-bold shadow-sm">
                  {user.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                   <p className="text-sm font-bold text-white truncate">{user.name}</p>
                   <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">{user.role}</p>
                </div>
             </div>
             <div className="flex gap-2 mb-2">
                <button 
                   onClick={toggleTheme}
                   className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-1.5 rounded text-xs flex items-center justify-center gap-1 transition"
                   title="Toggle Theme"
                >
                  {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
                </button>
             </div>
             <div className="flex gap-2">
                <Link to="/" className="flex-1 text-center text-xs font-bold bg-white text-black hover:bg-gray-200 py-2 rounded transition">
                   View Site
                </Link>
                <button 
                  onClick={logout} 
                  className="flex-1 text-center text-xs font-bold bg-red-900/40 hover:bg-red-900 text-red-200 py-2 rounded transition"
                >
                   Logout
                </button>
             </div>
          </div>
        </aside>

        {/* MAIN CONTENT WRAPPER */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
           
           {/* Mobile Header (Admin) */}
           <header className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4 z-30 shrink-0">
              <button 
                onClick={() => setIsAdminSidebarOpen(true)} 
                className="text-gray-600 dark:text-gray-300 p-2 -ml-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </button>
              <span className="font-bold text-lg dark:text-white">Dashboard</span>
              <div className="w-8">
                 {/* Spacer for centering */}
              </div> 
           </header>

           {/* Scrollable Content */}
           <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 scroll-smooth">
              {children}
           </main>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // PUBLIC LAYOUT
  // ----------------------------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Global Error Banner */}
      {globalError && (
        <div className="bg-red-600 text-white text-center p-2 text-sm font-bold">
          ⚠️ SYSTEM ALERT: {globalError} (Running in Offline Mode)
        </div>
      )}

      {/* Breaking News Ticker */}
      {tickerMsg && (
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

          {/* Date/Time Widget (New) */}
          <div className="hidden lg:flex flex-col ml-6 pl-6 border-l border-gray-200 dark:border-gray-700 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-tight">
             <span className="text-gray-900 dark:text-gray-200">{dateStr}</span>
             <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-brand-red">{timeStr}</span>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span>{locationName}</span>
             </div>
          </div>

          {/* Desktop Nav (Public Links) */}
          <nav className="hidden md:flex items-center gap-6 text-sm uppercase tracking-wider font-medium text-gray-700 dark:text-gray-300 ml-auto mr-6">
            <Link to="/" className={isActive('/')}>Home</Link>
            <Link to="/directory" className={isActive('/directory')}>Directory</Link>
            <Link to="/about" className={isActive('/about')}>About</Link>
            <Link to="/contact" className={isActive('/contact')}>Contact</Link>
            
            {user && (
              <>
                <div className="w-px h-4 bg-gray-300 mx-2"></div>
                <Link to="/admin" className="font-bold text-gray-700 dark:text-gray-300 hover:text-brand-red flex items-center gap-1">
                  <span>Dashboard</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
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
             {/* Date Time Mobile */}
             <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 text-center">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{dateStr}</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {timeStr} <span className="text-brand-red mx-1">•</span> {locationName}
                </p>
             </div>

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
                <Link to="/admin" className="py-2 font-bold text-brand-red" onClick={() => setIsMenuOpen(false)}>
                  Go to Dashboard
                </Link>
              )}

              <div className="border-t pt-4 flex flex-col gap-3">
                 <button onClick={() => { toggleTheme(); setIsMenuOpen(false); }} className="text-sm dark:text-gray-300">Toggle Theme</button>
                 {user ? <button onClick={logout} className="text-brand-red font-bold">Logout</button> : <Link to="/login" onClick={() => setIsMenuOpen(false)} className="font-bold dark:text-white">Sign In</Link>}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* ChatBot Widget */}
      <ChatBot />

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
