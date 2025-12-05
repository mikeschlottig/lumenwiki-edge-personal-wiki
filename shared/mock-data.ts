import type { User, Chat, ChatMessage, Document } from './types';
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'User A' },
  { id: 'u2', name: 'User B' }
];
export const MOCK_CHATS: Chat[] = [
  { id: 'c1', title: 'General' },
];
export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  { id: 'm1', chatId: 'c1', userId: 'u1', text: 'Hello', ts: Date.now() },
];
export const MOCK_DOCS: Document[] = [
  {
    id: 'doc-1',
    title: 'Welcome to LumenWiki',
    body: 'This is your first document in LumenWiki. It runs on the edge using Cloudflare Workers. You can write in **markdown** and see it rendered. Try creating a new document about "React Hooks" to see auto-linking in action.',
    tags: ['welcome', 'cloudflare', 'markdown'],
    createdAt: Date.now() - 1000 * 60 * 5,
    updatedAt: Date.now() - 1000 * 60 * 5,
    source: 'seed',
  },
  {
    id: 'doc-2',
    title: 'Getting Started with React Hooks',
    body: 'React Hooks are functions that let you "hook into" React state and lifecycle features from function components. The most common hooks are `useState` and `useEffect`. This is a powerful feature for managing component logic.',
    tags: ['react', 'hooks', 'javascript', 'frontend'],
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    updatedAt: Date.now() - 1000 * 60 * 30,
    source: 'seed',
  },
  {
    id: 'doc-3',
    title: 'Cloudflare Workers for Fun and Profit',
    body: 'Cloudflare Workers provide a serverless execution environment that allows you to create entirely new applications or augment existing ones without configuring or maintaining infrastructure. It\'s a key part of the technology behind LumenWiki.',
    tags: ['cloudflare', 'serverless', 'edge-computing'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    updatedAt: Date.now() - 1000 * 60 * 60 * 12,
    source: 'seed',
  },
  {
    id: 'doc-4',
    title: 'Advanced Markdown Tips',
    body: 'You can create tables, checklists, and code blocks.\n\n| Feature | Support |\n|---|---|\n| Tables | ✅ |\n| Code Blocks | ✅ |\n\n- [x] Task 1\n- [ ] Task 2',
    tags: ['markdown', 'writing', 'productivity'],
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
    updatedAt: Date.now() - 1000 * 60 * 60 * 48,
    source: 'seed',
  }
];