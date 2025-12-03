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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Fetch additional user details (Role, Name) from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          // Super Admin Logic:
          // If the email contains "admin", we force the role to 'admin'.
          // This allows you to "Bootstrap" the system even if the DB record is wrong.
          const isSuperAdminEmail = firebaseUser.email?.toLowerCase().includes('admin');

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: userData.name || 'Anonymous',
              role: isSuperAdminEmail ? 'admin' : (userData.role || 'journalist')
            });
          } else {
            // Fallback: If auth exists but firestore doc doesn't (e.g. manually created in console),
            // we default to 'admin' so you can set up the system.
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: 'System Admin',
              role: 'admin' // Default to admin for bootstrapping
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          // Even on error, if it looks like an admin email, let them in.
          const isSuperAdminEmail = firebaseUser.email?.toLowerCase().includes('admin');
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: 'User (Offline)',
            role: isSuperAdminEmail ? 'admin' : 'journalist'
          });
        }
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

  const isAdminOrEditor = user?.role === 'admin' || user?.role === 'editor';

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdminOrEditor }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};