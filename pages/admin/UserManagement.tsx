import React, { useEffect, useState } from 'react';
import { db, firebaseConfig } from '../../services/firebase';
import { collection, getDocs, doc, setDoc, query, orderBy, getFirestore } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'editor' | 'journalist'>('journalist');
  
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    // Security redirect if not admin
    if (currentUser && currentUser.role !== 'admin') {
      navigate('/admin');
      return;
    }
    fetchUsers();
  }, [currentUser, navigate]);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const userList = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setMsg({ type: '', text: '' });

    // Initialize a secondary Firebase App to create a user 
    // without logging out the current admin.
    const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
    const secondaryAuth = getAuth(secondaryApp);
    // CRITICAL FIX: Initialize Firestore for the secondary app so writes happen as the new user
    const secondaryDb = getFirestore(secondaryApp);

    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const newUser = userCredential.user;

      try {
        // 2. Create Firestore Profile (using the SECONDARY app's db connection)
        // This works because the request comes from 'newUser', satisfying "write own profile" rules.
        await setDoc(doc(secondaryDb, 'users', newUser.uid), {
          email: newUser.email,
          name: name,
          role: role,
          createdAt: Date.now()
        });
      } catch (dbError) {
        // ROLLBACK: If Firestore fails (e.g. permissions), delete the Auth user
        // so we don't end up with a "zombie" account that has no profile.
        console.error("Profile creation failed. Rolling back Auth user.", dbError);
        await deleteUser(newUser);
        throw dbError; // Re-throw to hit the outer catch block
      }

      // 3. Success & Reset
      setMsg({ type: 'success', text: `User ${name} created successfully!` });
      setName('');
      setEmail('');
      setPassword('');
      setRole('journalist');
      // We must reload the page or re-fetch to see the new user, 
      // but there might be a delay in Firestore propagation.
      setTimeout(fetchUsers, 1000);

    } catch (error: any) {
      console.error("Error creating user:", error);
      if (error.code === 'auth/email-already-in-use') {
        setMsg({ 
          type: 'error', 
          text: 'This email is already registered in Authentication. If the user does not appear in the list below, they may be a "ghost" account from a previous failed attempt. Please check Firebase Console or use a different email.' 
        });
      } else {
        setMsg({ type: 'error', text: 'Failed to create user. ' + error.message });
      }
    } finally {
      // 4. Cleanup secondary app
      await deleteApp(secondaryApp);
      setCreating(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading users...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 dark:text-white">User Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Create User Form */}
        <div className="bg-white dark:bg-gray-800 p-6 shadow-md border-t-4 border-brand-red h-fit">
          <h2 className="text-xl font-bold mb-4 dark:text-white">Add New Staff</h2>
          
          {msg.text && (
            <div className={`p-3 mb-4 text-sm rounded ${msg.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleCreateUser}>
            <div className="mb-3">
              <label className="block text-sm font-bold mb-1 dark:text-gray-300">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Staff Name"
                required
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-bold mb-1 dark:text-gray-300">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="staff@cvnews.com.na"
                required
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-bold mb-1 dark:text-gray-300">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Min 6 characters"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold mb-1 dark:text-gray-300">Role</label>
              <select 
                value={role}
                onChange={e => setRole(e.target.value as any)}
                className="w-full border p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="journalist">Journalist (Write Only)</option>
                <option value="editor">Editor (Publish Access)</option>
                <option value="admin">Admin (Full Access)</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={creating}
              className="w-full bg-black dark:bg-white dark:text-black text-white py-2 font-bold uppercase hover:opacity-80 disabled:opacity-50 transition"
            >
              {creating ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>

        {/* User List */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h2 className="font-bold dark:text-white">Existing Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                {users.map(u => (
                  <tr key={u.uid} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="p-3 font-medium dark:text-white">{u.name}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-400">{u.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                        ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                          u.role === 'editor' ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-gray-400 font-mono">{u.uid.substring(0, 8)}...</td>
                  </tr>
                ))}
                {users.length === 0 && (
                   <tr><td colSpan={4} className="p-4 text-center text-gray-500">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;