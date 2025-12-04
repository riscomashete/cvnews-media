
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

  getArticlesByCategory: async (category: string): Promise<Article[]> => {
    try {
      // Note: In a real app, you need a compound index for 'category' + 'createdAt'
      // For this demo, we'll fetch all and filter or use a simple query if indexed.
      const q = query(
        collection(firestore, COLLECTION_NAME), 
        where('category', '==', category),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
    } catch (error: any) {
      // Fallback if index is missing
      console.warn("Index might be missing, falling back to client filter", error);
      const all = await db.getArticles();
      return all.filter(a => a.category === category);
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
      // Fetch a larger pool of recent articles to find matches or fallbacks
      const q = query(collection(firestore, COLLECTION_NAME), orderBy('createdAt', 'desc'), limit(20));
      const snapshot = await getDocs(q);
      
      const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
      
      // 1. Try to find articles in the same category
      let related = all.filter(a => a.id !== currentId && a.category === category && a.published);
      
      // 2. If we don't have 3, fill up with other latest articles (Fallback)
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
  },

  // === BUSINESS DIRECTORY ===
  getBusinesses: async (): Promise<Business[]> => {
    try {
      const q = query(collection(firestore, 'businesses'), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Business));
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

  // === EVENTS CALENDAR ===
  getEvents: async (): Promise<AppEvent[]> => {
    try {
      const q = query(collection(firestore, 'events'), orderBy('date', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppEvent));
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

  // === COMMENTS ===
  getComments: async (articleId?: string): Promise<Comment[]> => {
    try {
      let q;
      if (articleId) {
        // OPTIMIZATION: Removed orderBy to prevent "Composite Index Required" error.
        // We will sort client-side instead.
        q = query(collection(firestore, 'comments'), where('articleId', '==', articleId));
      } else {
        q = query(collection(firestore, 'comments'), orderBy('createdAt', 'desc'));
      }
      const snapshot = await getDocs(q);
      const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      
      // Sort client-side (Newest first)
      return comments.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error: any) {
      if (error.code === 'permission-denied') {
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
      if (error.code === 'permission-denied') {
        alert("Failed to post comment. Please check your connection or permissions.");
      }
      throw error;
    }
  },

  deleteComment: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(firestore, 'comments', id));
    } catch (error: any) {
      console.error(error);
      if (error.code === 'permission-denied') {
        alert("Permission denied: You do not have rights to delete this comment. Please ensure you are logged in as a staff member and Firestore rules are updated.");
      } else {
        // Alert on other errors too so user isn't confused why button "did nothing"
        alert("Error deleting comment: " + error.message);
      }
      throw error;
    }
  }
};
