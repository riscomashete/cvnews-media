import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Automatically redirect to admin dashboard when user is authenticated
  useEffect(() => {
    if (user) {
      navigate('/admin');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // We do not set loading(false) here because we want to show 
      // the spinner until the redirect in useEffect happens.
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError("Invalid email or password.");
      } else if (err.code === 'auth/user-not-found') {
        setError("No user found with this email. Please contact an admin.");
      } else {
        setError("Login failed. Please check your connection.");
      }
      setLoading(false); // Only stop loading if there was an error
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="bg-white dark:bg-gray-800 p-8 shadow-md max-w-md w-full border-t-4 border-brand-red">
        <h2 className="text-2xl font-bold mb-2 text-center dark:text-white">
          Staff Login
        </h2>
        <p className="text-center text-gray-500 text-sm mb-6">
          CVNEWS MEDIA CC Dashboard
        </p>

        {error && <div className="bg-red-100 text-red-700 p-3 mb-4 text-sm rounded">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2 dark:text-gray-300">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-bold mb-2 dark:text-gray-300">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-brand-red text-white font-bold py-2 hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-400">
            Don't have an account? Contact your System Administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;