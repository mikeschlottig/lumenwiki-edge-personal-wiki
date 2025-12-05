export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
// Minimal real-world chat example types (shared by frontend and worker)
// These can be removed if not used, but we'll keep them for now.
export interface User {
  id: string;
  name: string;
}
export interface Chat {
  id: string;
  title: string;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number; // epoch millis
}
// LumenWiki specific types
export interface Document {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  source?: string;
  origin?: string; // e.g., URL for imported docs
  backlinks?: { docId: string; title: string }[];
}
export type DocumentState = Document;
export interface ImportItem {
  title: string;
  body: string;
  origin?: string;
}
export interface ImportPayload {
  source: 'paste' | 'upload' | 'url';
  items: ImportItem[];
}