import { Hono } from "hono";
import type { Env } from './core-utils';
import { DocumentEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { Document, ImportPayload } from "@shared/types";
import { extractTags, findLinks } from "@/lib/worker-nlp"; // Assuming worker can import from src/lib
// A simple worker-side NLP function since we can't import from src
const workerExtractTags = (text: string, n = 5): string[] => {
  if (!text) return [];
  const words = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').split(/\s+/);
  const freq: Record<string, number> = {};
  const stopWords = new Set(['the', 'a', 'an', 'in', 'is', 'it', 'of', 'and', 'for', 'to']);
  words.forEach(w => {
    if (w.length > 2 && !stopWords.has(w) && isNaN(Number(w))) {
      freq[w] = (freq[w] || 0) + 1;
    }
  });
  return Object.entries(freq).sort(([,a],[,b]) => b-a).slice(0, n).map(([word]) => word);
};
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // --- DOCS API ---
  app.get('/api/docs', async (c) => {
    await DocumentEntity.ensureSeed(c.env);
    const { items } = await DocumentEntity.list(c.env);
    // sort by updatedAt descending
    items.sort((a, b) => b.updatedAt - a.updatedAt);
    return ok(c, items);
  });
  app.post('/api/docs', async (c) => {
    const { title, body, source, origin } = await c.req.json<Partial<Document>>();
    if (!isStr(title) || !isStr(body)) return bad(c, 'title and body are required');
    const now = Date.now();
    const newDoc: Document = {
      id: crypto.randomUUID(),
      title: title.trim(),
      body: body.trim(),
      tags: workerExtractTags(title + ' ' + body),
      createdAt: now,
      updatedAt: now,
      source: source || 'editor',
      origin: origin,
      backlinks: [], // Backlink generation would happen here
    };
    await DocumentEntity.create(c.env, newDoc);
    return ok(c, newDoc);
  });
  app.get('/api/docs/:id', async (c) => {
    const id = c.req.param('id');
    const doc = new DocumentEntity(c.env, id);
    if (!await doc.exists()) return notFound(c, 'document not found');
    return ok(c, await doc.getState());
  });
  app.put('/api/docs/:id', async (c) => {
    const id = c.req.param('id');
    const { title, body } = await c.req.json<Partial<Document>>();
    if (!isStr(title) && !isStr(body)) return bad(c, 'title or body is required');
    const doc = new DocumentEntity(c.env, id);
    if (!await doc.exists()) return notFound(c, 'document not found');
    const updatedDoc = await doc.mutate(current => {
      const newBody = body ?? current.body;
      const newTitle = title ?? current.title;
      return {
        ...current,
        title: newTitle.trim(),
        body: newBody.trim(),
        tags: workerExtractTags(newTitle + ' ' + newBody),
        updatedAt: Date.now(),
      };
    });
    return ok(c, updatedDoc);
  });
  app.delete('/api/docs/:id', async (c) => {
    const id = c.req.param('id');
    const deleted = await DocumentEntity.delete(c.env, id);
    return ok(c, { id, deleted });
  });
  app.post('/api/docs/import', async (c) => {
    const payload = await c.req.json<ImportPayload>();
    if (!payload || !payload.items || !Array.isArray(payload.items)) {
      return bad(c, 'Invalid import payload');
    }
    const createdDocs: Document[] = [];
    for (const item of payload.items) {
      if (!isStr(item.title) || !isStr(item.body)) continue;
      const now = Date.now();
      const newDoc: Document = {
        id: crypto.randomUUID(),
        title: item.title.trim(),
        body: item.body.trim(),
        tags: workerExtractTags(item.title + ' ' + item.body),
        createdAt: now,
        updatedAt: now,
        source: payload.source,
        origin: item.origin,
        backlinks: [],
      };
      await DocumentEntity.create(c.env, newDoc);
      createdDocs.push(newDoc);
    }
    return ok(c, { createdCount: createdDocs.length, items: createdDocs });
  });
  app.get('/api/docs/tags', async (c) => {
    await DocumentEntity.ensureSeed(c.env);
    const { items } = await DocumentEntity.list(c.env);
    const tagCounts: Record<string, number> = {};
    items.forEach(doc => {
      doc.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
    return ok(c, topTags);
  });
}