import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path ? 'text-brand-red font-bold' : 'hover:text-brand-red';

  React.useEffect(() => {
    const handleError = () => {
      setGlobalError('Database permissions are locked. Features may be limited. Please update Firebase Rules.');
    };
    window.addEventListener('firestore-permission-error', handleError);
    return () => window.removeEventListener('firestore-permission-error', handleError);
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Global Error Banner */}
      {globalError && (
        <div className="bg-red-600 text-white text-center p-2 text-sm font-bold">
          ⚠️ SYSTEM ALERT: {globalError} (Running in Offline Mode)
        </div>
      )}

      {/* Header */}
      <header className="bg-white dark:bg-brand-dark border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-brand-red text-white p-1 font-bold text-xl tracking-tighter">CV</div>
            <span className="text-xl font-bold tracking-wide dark:text-white">NEWS MEDIA</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm uppercase tracking-wider font-medium text-gray-700 dark:text-gray-300">
            <Link to="/" className={isActive('/')}>Home</Link>
            <Link to="/about" className={isActive('/about')}>About</Link>
            <Link to="/contact" className={isActive('/contact')}>Contact</Link>
            {user && (
              <>
                <div className="w-px h-4 bg-gray-300 mx-2"></div>
                <Link to="/admin" className={isActive('/admin')}>Dashboard</Link>
                <Link to="/admin/messages" className={isActive('/admin/messages')}>Messages</Link>
                <Link to="/admin/ads" className={isActive('/admin/ads')}>Ads</Link>
                {user.role === 'admin' && <Link to="/admin/users" className={isActive('/admin/users')}>Users</Link>}
              </>
            )}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
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
            <nav className="flex flex-col p-4 gap-4 text-center">
              <Link to="/" className="py-2 hover:text-brand-red dark:text-gray-300" onClick={() => setIsMenuOpen(false)}>Home</Link>
              <Link to="/about" className="py-2 hover:text-brand-red dark:text-gray-300" onClick={() => setIsMenuOpen(false)}>About</Link>
              <Link to="/contact" className="py-2 hover:text-brand-red dark:text-gray-300" onClick={() => setIsMenuOpen(false)}>Contact</Link>
              {user && (
                <>
                  <Link to="/admin" className="py-2 hover:text-brand-red font-bold text-brand-red" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                  <Link to="/admin/messages" className="py-2 hover:text-brand-red font-bold" onClick={() => setIsMenuOpen(false)}>Messages</Link>
                  <Link to="/admin/ads" className="py-2 hover:text-brand-red font-bold" onClick={() => setIsMenuOpen(false)}>Manage Ads</Link>
                  {user.role === 'admin' && <Link to="/admin/users" className="py-2 hover:text-brand-red font-bold" onClick={() => setIsMenuOpen(false)}>Manage Users</Link>}
                </>
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
              <li><Link to="/about" className="hover:text-white transition">Mission & Vision</Link></li>
              <li><Link to="/contact" className="hover:text-white transition">Advertise with Us</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Staff Portal</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-gray-200">Contact</h3>
            <p className="text-gray-400 text-sm mb-2">Windhoek, Namibia</p>
            <p className="text-gray-400 text-sm mb-2">info@cvnews.com.na</p>
            <div className="flex gap-4 mt-4">
               {/* Social placeholders */}
               <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-brand-red transition cursor-pointer">F</div>
               <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-brand-red transition cursor-pointer">T</div>
               <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-brand-red transition cursor-pointer">I</div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-600 text-xs">
          &copy; {new Date().getFullYear()} CVNEWS MEDIA CC. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Layout;