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

export type Theme = 'light' | 'dark';

export interface AlertState {
  type: 'success' | 'error' | 'info';
  message: string;
}