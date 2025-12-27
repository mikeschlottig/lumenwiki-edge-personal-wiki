# LumenWiki — Edge Personal Wiki

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/mikeschlottig/lumenwiki-edge-personal-wiki)

LumenWiki is a personal Wiki built to run on Cloudflare Workers + Durable Object storage. It provides a clean, minimalist editor and dashboard with a collapsible left-side vault panel, fast import (single & bulk), paste/upload support, auto-generated metadata stamps (createdAt, updatedAt, source, import-origin), and automatic tagging & bidirectional linking. Documents are stored as markdown/plain-text with searchable metadata and relationships.

## Features

- **Minimalist Interface**: Clean, responsive UI with collapsible left-side vault panel for navigation, tags, and filters.
- **Document Management**: Full CRUD operations for wiki documents with markdown/plain-text support and preview toggle.
- **Auto Tagging & Linking**: Lightweight, deterministic algorithm for generating tags and bidirectional links between documents.
- **Import Capabilities**: Paste text, upload files (TXT/MD/DOCX), single/bulk URL imports with preview, deduplication, and metadata stamping.
- **Export Options**: Download selected or full vault as JSON or Markdown (zipped archives).
- **Dashboard Overview**: Recent documents, top tags, quick search, stats, and actionable cards.
- **Filtered Views & Search**: Filter by tag, date, source; client-side fuzzy search for instant results.
- **Edge-Powered**: Runs entirely on Cloudflare Workers for low-latency, global performance with Durable Objects for storage.
- **Visual Excellence**: Polished micro-interactions, skeleton loaders, and responsive design using shadcn/ui and Tailwind CSS.

## Technology Stack

- **Frontend**: React 18, TypeScript, shadcn/ui, Tailwind CSS v3, framer-motion (animations), @tanstack/react-query (data fetching), lucide-react (icons), react-router-dom (routing).
- **Backend**: Hono (routing), Cloudflare Workers, Durable Objects (storage), IndexedEntity pattern for efficient listing and search.
- **Shared**: Zod (validation), Immer (immutable updates), Zustand (state management).
- **Utilities**: react-markdown + remark-gfm (markdown rendering), date-fns (date handling), sonner (toasts), uuid (ID generation).
- **Development**: Vite (build tool), Bun (package manager), ESLint + TypeScript (linting/type safety).

## Quick Start

### Prerequisites

- Node.js 18+ (or Bun)
- Cloudflare account with Workers enabled
- Wrangler CLI installed: `bunx wrangler@latest login`

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd lumen-wiki
   ```

2. Install dependencies using Bun:
   ```
   bun install
   ```

3. Generate TypeScript types from Wrangler:
   ```
   bun run cf-typegen
   ```

### Development

- Start the development server:
  ```
  bun dev
  ```
  The app will be available at `http://localhost:3000`.

- Build for production:
  ```
  bun build
  ```

- Lint the codebase:
  ```
  bun lint
  ```

### Usage Examples

#### Creating a Document
1. On the dashboard, click "Create New Note" to open the editor.
2. Enter a title, add content in markdown/plain text.
3. Tags and backlinks are auto-generated on save.
4. Use the preview toggle for WYSIWYG view.

#### Importing Content
1. Navigate to the Import page via the vault panel.
2. Paste text, drag-and-drop files, or enter URLs (single or bulk).
3. Review preview with suggested tags/metadata, then confirm import.
4. Imported docs appear in the dashboard with auto-links.

#### Searching and Filtering
1. Use the global search bar for fuzzy matching across titles and content.
2. In the vault panel, select tags, date ranges, or saved filters for refined views.
3. Results display as cards with excerpts, timestamps, and actions.

#### Exporting
1. Select documents in the list view.
2. Click "Export" and choose JSON or Markdown format.
3. Downloads start immediately for single docs; bulk exports are zipped.

The app seeds mock data on first run for demo purposes. Real data persists via Durable Objects.

## Deployment

Deploy to Cloudflare Workers for global edge deployment:

1. Ensure you're logged in: `bunx wrangler@latest login`
2. Deploy the worker:
   ```
   bun deploy
   ```
   This builds the frontend assets and deploys the Worker.

3. Access your deployed app at the provided Worker URL.

For one-click deployment:

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/mikeschlottig/lumenwiki-edge-personal-wiki)

### Custom Domain
After deployment, add a custom domain via the Cloudflare dashboard under Workers > Your Worker > Triggers > Custom Domain.

### Environment Variables
No custom env vars are required, but you can extend `wrangler.jsonc` for secrets if needed (e.g., API keys for advanced features).

## Architecture Overview

- **Frontend**: Single-page React app with routing for dashboard, editor, import, and settings. Uses React Query for API caching and optimistic updates.
- **Backend**: Hono-based Worker with routes under `/api/docs` for document operations. Durable Objects handle storage with CAS for concurrency safety.
- **Data Flow**: Frontend → Worker API → IndexedEntity → GlobalDurableObject. Indexes enable efficient pagination and listing.
- **Storage**: All data in a single Durable Object namespace; entities like `DocumentEntity` manage isolation.

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/amazing-feature`.
3. Commit changes: `git commit -m 'Add some amazing feature'`.
4. Push to the branch: `git push origin feature/amazing-feature`.
5. Open a Pull Request.

Follow TypeScript and ESLint rules. Focus on visual polish and performance.

## License

This project is MIT licensed. See [LICENSE](LICENSE) for details.

## Support

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- Report issues on the GitHub repository.
- For WorkersAI integration questions, refer to Cloudflare's AI docs.