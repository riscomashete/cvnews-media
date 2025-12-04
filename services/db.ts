import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db as firestore } from './firebase'; 
import { Article, ContactMessage, Advertisement } from '../types';

const COLLECTION_NAME = 'articles';

export const db = {
  getArticles: async (): Promise<Article[]> => {
    try {
      const q = query(collection(firestore, COLLECTION_NAME), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Article));
    } catch (error: any) {
      console.error("Error getting articles:", error);
      // Broadcast error for global banner
      if (error.code === 'permission-denied') {
        window.dispatchEvent(new Event('firestore-permission-error'));
        // Return local articles if offline
        const local = localStorage.getItem('local_articles');
        return local ? JSON.parse(local) : [];
      }
      return [];
    }
  },

  getArticleById: async (id: string): Promise<Article | undefined> => {
    try {
      // Check local storage first if it looks like a local ID
      if (id.startsWith('local_')) {
        const localArticles = JSON.parse(localStorage.getItem('local_articles') || '[]');
        return localArticles.find((a: Article) => a.id === id);
      }

      const docRef = doc(firestore, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Article;
      } else {
        return undefined;
      }
    } catch (error) {
      console.error("Error getting article by ID:", error);
      return undefined;
    }
  },

  createArticle: async (article: Omit<Article, 'id' | 'createdAt' | 'views'>): Promise<Article> => {
    try {
      const newArticleData = {
        ...article,
        createdAt: Date.now(),
        views: 0
      };
      
      const docRef = await addDoc(collection(firestore, COLLECTION_NAME), newArticleData);
      
      return {
        id: docRef.id,
        ...newArticleData
      } as Article;
    } catch (error: any) {
      console.error("Error creating article:", error);
      if (error.code === 'permission-denied') {
        window.dispatchEvent(new Event('firestore-permission-error'));
        // Fallback to LocalStorage so user doesn't lose work
        const localArticles = JSON.parse(localStorage.getItem('local_articles') || '[]');
        const localId = 'local_' + Date.now();
        const localArticle = { id: localId, ...article, createdAt: Date.now(), views: 0 };
        localArticles.push(localArticle);
        localStorage.setItem('local_articles', JSON.stringify(localArticles));
        alert("Saved to Local Storage (Offline Mode) due to permission error.");
        return localArticle as Article;
      }
      throw error;
    }
  },

  updateArticle: async (id: string, updates: Partial<Article>): Promise<void> => {
    try {
      if (id.startsWith('local_')) {
        const localArticles = JSON.parse(localStorage.getItem('local_articles') || '[]');
        const updatedArticles = localArticles.map((a: Article) => a.id === id ? { ...a, ...updates } : a);
        localStorage.setItem('local_articles', JSON.stringify(updatedArticles));
        return;
      }
      const docRef = doc(firestore, COLLECTION_NAME, id);
      await updateDoc(docRef, updates);
    } catch (error: any) {
      console.error("Error updating article:", error);
      if (error.code === 'permission-denied') {
         alert("Cannot update cloud article due to permissions. Check Console.");
      }
      throw error;
    }
  },

  deleteArticle: async (id: string): Promise<void> => {
    try {
      if (id.startsWith('local_')) {
        const localArticles = JSON.parse(localStorage.getItem('local_articles') || '[]');
        const filtered = localArticles.filter((a: Article) => a.id !== id);
        localStorage.setItem('local_articles', JSON.stringify(filtered));
        return;
      }
      await deleteDoc(doc(firestore, COLLECTION_NAME, id));
    } catch (error) {
      console.error("Error deleting article:", error);
      throw error;
    }
  },

  // NEW: Subscribe to Newsletter
  subscribe: async (email: string): Promise<void> => {
    try {
      await addDoc(collection(firestore, 'subscribers'), {
        email,
        createdAt: Date.now()
      });
    } catch (error) {
      console.error("Error subscribing:", error);
      throw error;
    }
  },

  // NEW: Send Contact Message
  sendMessage: async (data: { name: string; email: string; message: string }): Promise<void> => {
    try {
      await addDoc(collection(firestore, 'messages'), {
        ...data,
        createdAt: Date.now()
      });
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  getMessages: async (): Promise<ContactMessage[]> => {
    try {
      const q = query(collection(firestore, 'messages'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as ContactMessage));
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  },

  deleteMessage: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(firestore, 'messages', id));
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  },

  // === ADVERTISEMENTS ===
  getAds: async (): Promise<Advertisement[]> => {
    try {
      const q = query(collection(firestore, 'advertisements'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Advertisement));
    } catch (error: any) {
      console.error("Error fetching ads:", error);
      if (error.code === 'permission-denied') {
        const local = localStorage.getItem('local_ads');
        return local ? JSON.parse(local) : [];
      }
      return [];
    }
  },

  createAd: async (ad: Omit<Advertisement, 'id' | 'createdAt'>): Promise<void> => {
    try {
      await addDoc(collection(firestore, 'advertisements'), {
        ...ad,
        createdAt: Date.now()
      });
    } catch (error: any) {
      console.error("Error creating ad:", error);
      if (error.code === 'permission-denied') {
        window.dispatchEvent(new Event('firestore-permission-error'));
        const localAds = JSON.parse(localStorage.getItem('local_ads') || '[]');
        const newAd = { id: 'local_ad_' + Date.now(), ...ad, createdAt: Date.now() };
        localAds.unshift(newAd);
        localStorage.setItem('local_ads', JSON.stringify(localAds));
        alert("Saved Ad to Local Storage (Offline Mode) due to permission error.");
        return;
      }
      throw error;
    }
  },

  deleteAd: async (id: string): Promise<void> => {
    try {
      if (id.startsWith('local_')) {
        const localAds = JSON.parse(localStorage.getItem('local_ads') || '[]');
        const filtered = localAds.filter((a: Advertisement) => a.id !== id);
        localStorage.setItem('local_ads', JSON.stringify(filtered));
        return;
      }
      await deleteDoc(doc(firestore, 'advertisements', id));
    } catch (error: any) {
      console.error("Error deleting ad:", error);
      if (error.code === 'permission-denied') {
        alert("Permission denied to delete cloud ad.");
      }
      throw error;
    }
  },

  toggleAdStatus: async (id: string, currentStatus: boolean): Promise<void> => {
    try {
      if (id.startsWith('local_')) {
        const localAds = JSON.parse(localStorage.getItem('local_ads') || '[]');
        const updated = localAds.map((a: Advertisement) => a.id === id ? { ...a, active: !currentStatus } : a);
        localStorage.setItem('local_ads', JSON.stringify(updated));
        return;
      }
      await updateDoc(doc(firestore, 'advertisements', id), { active: !currentStatus });
    } catch (error: any) {
      console.error("Error toggling ad status:", error);
      if (error.code === 'permission-denied') {
         alert("Permission denied to update cloud ad.");
      }
      throw error;
    }
  }
};