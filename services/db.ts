
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  where,
  limit,
  increment
} from 'firebase/firestore';
import { db as firestore } from './firebase'; 
import { Article, ContactMessage, Advertisement, Business, AppEvent, Comment } from '../types';

const COLLECTION_NAME = 'articles';

export const db = {
  getArticles: async (): Promise<Article[]> => {
    try {
      const q = query(collection(firestore, COLLECTION_NAME), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const serverArticles = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Article));
      
      // Merge with local articles if any
      const localArticles = JSON.parse(localStorage.getItem('local_articles') || '[]');
      return [...localArticles, ...serverArticles];
    } catch (error: any) {
      console.error("Error getting articles:", error);
      if (error.code === 'permission-denied') {
        window.dispatchEvent(new Event('firestore-permission-error'));
        const local = localStorage.getItem('local_articles');
        return local ? JSON.parse(local) : [];
      }
      return [];
    }
  },

  getArticlesByCategory: async (category: string): Promise<Article[]> => {
    try {
      const q = query(
        collection(firestore, COLLECTION_NAME), 
        where('category', '==', category),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
    } catch (error: any) {
      console.warn("Index might be missing, falling back to client filter", error);
      const all = await db.getArticles();
      return all.filter(a => a.category === category);
    }
  },

  getArticleById: async (id: string): Promise<Article | undefined> => {
    try {
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

  incrementView: async (id: string): Promise<void> => {
    if (id.startsWith('local_')) return;
    try {
      const docRef = doc(firestore, COLLECTION_NAME, id);
      await updateDoc(docRef, { views: increment(1) });
    } catch (error) {
      console.error("Error incrementing view:", error);
    }
  },

  getRelatedArticles: async (currentId: string, category: string): Promise<Article[]> => {
    try {
      const q = query(collection(firestore, COLLECTION_NAME), orderBy('createdAt', 'desc'), limit(20));
      const snapshot = await getDocs(q);
      
      const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
      let related = all.filter(a => a.id !== currentId && a.category === category && a.published);
      
      if (related.length < 3) {
        const others = all.filter(a => a.id !== currentId && a.category !== category && a.published);
        related = [...related, ...others];
      }
      
      return related.slice(0, 3);
    } catch (error) {
      console.error("Error fetching related articles", error);
      return [];
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
      if (!id) throw new Error("No ID provided");
      
      // Handle local offline messages if implemented later or if legacy
      if (id.startsWith('local_')) {
         const local = JSON.parse(localStorage.getItem('local_messages') || '[]');
         const filtered = local.filter((m: ContactMessage) => m.id !== id);
         localStorage.setItem('local_messages', JSON.stringify(filtered));
         return;
      }

      const docRef = doc(firestore, 'messages', id);
      await deleteDoc(docRef);
    } catch (error: any) {
      console.error("Error deleting message:", error);
      throw new Error(error.message || "Database delete failed");
    }
  },

  getAds: async (): Promise<Advertisement[]> => {
    try {
      const q = query(collection(firestore, 'advertisements'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const serverAds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Advertisement));
      const localAds = JSON.parse(localStorage.getItem('local_ads') || '[]');
      return [...localAds, ...serverAds];
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
      throw error;
    }
  },

  getBusinesses: async (): Promise<Business[]> => {
    try {
      const q = query(collection(firestore, 'businesses'), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      const serverBiz = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Business));
      const localBiz = JSON.parse(localStorage.getItem('local_businesses') || '[]');
      return [...localBiz, ...serverBiz];
    } catch (error: any) {
      console.error("Error fetching businesses:", error);
      if (error.code === 'permission-denied') {
        const local = localStorage.getItem('local_businesses');
        return local ? JSON.parse(local) : [];
      }
      return [];
    }
  },

  createBusiness: async (business: Omit<Business, 'id' | 'createdAt'>): Promise<void> => {
    try {
      await addDoc(collection(firestore, 'businesses'), {
        ...business,
        createdAt: Date.now()
      });
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        const local = JSON.parse(localStorage.getItem('local_businesses') || '[]');
        local.push({ id: 'local_' + Date.now(), ...business, createdAt: Date.now() });
        localStorage.setItem('local_businesses', JSON.stringify(local));
        alert("Saved to local storage (Offline Mode)");
        return;
      }
      throw error;
    }
  },

  deleteBusiness: async (id: string): Promise<void> => {
    try {
      if (id.startsWith('local_')) {
        const local = JSON.parse(localStorage.getItem('local_businesses') || '[]');
        const filtered = local.filter((b: Business) => b.id !== id);
        localStorage.setItem('local_businesses', JSON.stringify(filtered));
        return;
      }
      await deleteDoc(doc(firestore, 'businesses', id));
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  getEvents: async (): Promise<AppEvent[]> => {
    try {
      const q = query(collection(firestore, 'events'), orderBy('date', 'asc'));
      const snapshot = await getDocs(q);
      const serverEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppEvent));
      const localEvents = JSON.parse(localStorage.getItem('local_events') || '[]');
      return [...localEvents, ...serverEvents];
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        const local = localStorage.getItem('local_events');
        return local ? JSON.parse(local) : [];
      }
      return [];
    }
  },

  createEvent: async (event: Omit<AppEvent, 'id' | 'createdAt'>): Promise<void> => {
    try {
      await addDoc(collection(firestore, 'events'), {
        ...event,
        createdAt: Date.now()
      });
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        const local = JSON.parse(localStorage.getItem('local_events') || '[]');
        local.push({ id: 'local_' + Date.now(), ...event, createdAt: Date.now() });
        localStorage.setItem('local_events', JSON.stringify(local));
        return;
      }
      throw error;
    }
  },

  deleteEvent: async (id: string): Promise<void> => {
    try {
      if (id.startsWith('local_')) {
        const local = JSON.parse(localStorage.getItem('local_events') || '[]');
        const filtered = local.filter((e: AppEvent) => e.id !== id);
        localStorage.setItem('local_events', JSON.stringify(filtered));
        return;
      }
      await deleteDoc(doc(firestore, 'events', id));
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  getComments: async (articleId?: string): Promise<Comment[]> => {
    try {
      let q;
      if (articleId) {
        q = query(collection(firestore, 'comments'), where('articleId', '==', articleId));
      } else {
        q = query(collection(firestore, 'comments'), orderBy('createdAt', 'desc'));
      }
      const snapshot = await getDocs(q);
      const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      
      // Since comments aren't locally stored usually, we don't merge here unless strictly needed
      // but for consistency we could check local_comments key if we implemented offline comments
      return comments.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error: any) {
      if (error.code === 'permission-denied') {
         console.warn("Permission denied fetching comments");
         return [];
      }
      console.error(error);
      return [];
    }
  },

  addComment: async (comment: Omit<Comment, 'id' | 'createdAt'>): Promise<void> => {
    try {
      await addDoc(collection(firestore, 'comments'), {
        ...comment,
        createdAt: Date.now()
      });
    } catch (error: any) {
      console.error(error);
      throw error;
    }
  },

  deleteComment: async (id: string): Promise<void> => {
    try {
      if (!id) throw new Error("No ID provided");
      
      if (id.startsWith('local_')) {
        // Fallback if we ever implement offline comments
        console.warn("Attempting to delete local comment (not fully supported but handling gracefully)");
        return;
      }

      await deleteDoc(doc(firestore, 'comments', id));
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      throw new Error(error.message || "Database delete failed");
    }
  }
};
