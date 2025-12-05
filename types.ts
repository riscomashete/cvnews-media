
export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorId?: string; // New field to link to user profile
  category: string;
  imageUrl: string;
  createdAt: number;
  published: boolean;
  views: number;
  seoTitle?: string;
  metaDescription?: string;
  keywords?: string;
}

export interface User {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'journalist';
  jobTitle?: string; // Custom title for display (e.g. "Senior Sports Editor")
  avatarUrl?: string;
  bio?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: number;
}

export interface Advertisement {
  id: string;
  title: string;
  type: 'image' | 'video' | 'announcement'; 
  mediaUrl?: string; // Base64 for image, URL for video
  content?: string; // For text-based announcements
  linkUrl?: string;
  active: boolean;
  createdAt: number;
}

export interface Business {
  id: string;
  name: string;
  category: string;
  logoUrl: string; // Base64 or URL
  description: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  createdAt: number;
}

export interface AppEvent {
  id: string;
  title: string;
  date: string; // ISO date string YYYY-MM-DD
  time: string;
  location: string;
  description: string;
  linkUrl?: string;
  createdAt: number;
}

export interface Comment {
  id: string;
  articleId: string;
  articleTitle?: string; // Optional, for admin display
  parentId?: string; // For nested replies
  name: string;
  content: string;
  isStaff?: boolean; // Verified staff badge
  createdAt: number;
}

export type Theme = 'light' | 'dark';

export interface AlertState {
  type: 'success' | 'error' | 'info';
  message: string;
}
