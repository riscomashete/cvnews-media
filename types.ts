export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  imageUrl: string;
  createdAt: number;
  published: boolean;
  views: number;
}

export interface User {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'journalist';
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

export type Theme = 'light' | 'dark';

export interface AlertState {
  type: 'success' | 'error' | 'info';
  message: string;
}