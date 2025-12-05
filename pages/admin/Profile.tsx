
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';

const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setJobTitle(user.jobTitle || '');
      setBio(user.bio || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  // Image compression utility to avoid huge DB payloads
  const compressImage = (source: string, maxWidth = 300): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = source;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
           ctx.drawImage(img, 0, 0, width, height);
           // Convert to PNG 
           resolve(canvas.toDataURL('image/png'));
        } else {
           resolve(source);
        }
      };
      img.onerror = () => resolve(source);
    });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
       const raw = evt.target?.result as string;
       try {
         // Compress to small size for avatar
         const compressed = await compressImage(raw, 250);
         setAvatarUrl(compressed);
       } catch (err) {
         console.error(err);
       }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    setMsg(null);

    try {
      await db.updateUser(user.uid, {
        name,
        jobTitle,
        bio,
        avatarUrl
      });
      await refreshUser(); // Update global context immediately
      setMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      console.error(error);
      setMsg({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8 dark:text-white">My Profile</h1>

      {msg && (
        <div className={`p-4 mb-6 rounded text-sm font-bold ${msg.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {msg.text}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 border-t-4 border-brand-red">
        <form onSubmit={handleSubmit}>
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mb-4 border-2 border-gray-100 dark:border-gray-600 shadow-sm relative group">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">
                  {name.charAt(0)}
                </div>
              )}
            </div>
            
            <label className="cursor-pointer text-sm font-bold text-brand-red hover:underline uppercase">
              Change Photo
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>

          {/* Fields */}
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase mb-1 dark:text-gray-300">System Role</label>
              <input 
                type="text" 
                value={user?.role?.toUpperCase()} 
                disabled 
                className="w-full border p-2 bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed" 
              />
              <p className="text-[10px] text-gray-500 mt-1">This permission level is set by the Administrator.</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1 dark:text-gray-300">Full Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1 dark:text-gray-300">Job Title / Department</label>
              <input 
                type="text" 
                value={jobTitle} 
                onChange={e => setJobTitle(e.target.value)} 
                placeholder="e.g. Senior Sports Journalist, Marketing Manager"
                className="w-full border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <p className="text-[10px] text-gray-500 mt-1">This will be displayed publicly next to your name.</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1 dark:text-gray-300">Email (Read Only)</label>
              <input 
                type="email" 
                value={user?.email} 
                disabled 
                className="w-full border p-2 bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1 dark:text-gray-300">Bio / About Me</label>
              <textarea 
                rows={4}
                value={bio} 
                onChange={e => setBio(e.target.value)} 
                placeholder="Share a short bio..."
                className="w-full border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <p className="text-[10px] text-gray-500 mt-1">This will be displayed on articles you write.</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
            <button 
              type="submit" 
              disabled={saving}
              className="w-full bg-black dark:bg-white dark:text-black text-white py-3 font-bold uppercase hover:opacity-80 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
