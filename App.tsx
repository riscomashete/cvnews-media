
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Article from './pages/Article';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Search from './pages/Search'; 
import Directory from './pages/Directory';
import CategoryPage from './pages/CategoryPage'; // New

import Dashboard from './pages/admin/Dashboard';
import ArticleEditor from './pages/admin/ArticleEditor';
import UserManagement from './pages/admin/UserManagement';
import AdsManager from './pages/admin/AdsManager';
import Messages from './pages/admin/Messages';
import DirectoryManager from './pages/admin/DirectoryManager';
import EventsManager from './pages/admin/EventsManager'; // New
import CommentsManager from './pages/admin/CommentsManager'; // New

import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/article/:id" element={<Article />} />
              <Route path="/category/:categoryName" element={<CategoryPage />} />
              <Route path="/search" element={<Search />} />
              <Route path="/directory" element={<Directory />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute>
                  <UserManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/ads" element={
                <ProtectedRoute>
                  <AdsManager />
                </ProtectedRoute>
              } />
              <Route path="/admin/messages" element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              } />
              <Route path="/admin/directory" element={
                <ProtectedRoute>
                  <DirectoryManager />
                </ProtectedRoute>
              } />
              <Route path="/admin/events" element={
                <ProtectedRoute>
                  <EventsManager />
                </ProtectedRoute>
              } />
              <Route path="/admin/comments" element={
                <ProtectedRoute>
                  <CommentsManager />
                </ProtectedRoute>
              } />
              <Route path="/admin/create" element={
                <ProtectedRoute>
                  <ArticleEditor />
                </ProtectedRoute>
              } />
              <Route path="/admin/edit/:id" element={
                <ProtectedRoute>
                  <ArticleEditor />
                </ProtectedRoute>
              } />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
