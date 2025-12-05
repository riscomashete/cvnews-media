
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { auth, db } from '../services/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  isAdminOrEditor: boolean;
  refreshUser: () => Promise<void>; // Added function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  const fetchUserData = async (fUser: FirebaseUser) => {
    try {
      // Fetch additional user details (Role, Name, Avatar, Bio) from Firestore
      const userDocRef = doc(db, 'users', fUser.uid);
      const userDoc = await getDoc(userDocRef);

      const isSuperAdminEmail = fUser.email?.toLowerCase().includes('admin');

      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUser({
          uid: fUser.uid,
          email: fUser.email || '',
          name: userData.name || 'Anonymous',
          role: isSuperAdminEmail ? 'admin' : (userData.role || 'journalist'),
          jobTitle: userData.jobTitle, // Added missing field
          avatarUrl: userData.avatarUrl,
          bio: userData.bio
        });
      } else {
        // Fallback for bootstrap
        setUser({
          uid: fUser.uid,
          email: fUser.email || '',
          name: 'System Admin',
          role: 'admin' 
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      const isSuperAdminEmail = fUser.email?.toLowerCase().includes('admin');
      setUser({
        uid: fUser.uid,
        email: fUser.email || '',
        name: 'User (Offline)',
        role: isSuperAdminEmail ? 'admin' : 'journalist'
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser: FirebaseUser | null) => {
      setFirebaseUser(fUser);
      if (fUser) {
        await fetchUserData(fUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      await fetchUserData(firebaseUser);
    }
  };

  const isAdminOrEditor = user?.role === 'admin' || user?.role === 'editor';

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdminOrEditor, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
