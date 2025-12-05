import { Hono } from "hono";
import type { Env } from './core-utils';
import { DocumentEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { Document, ImportPayload } from "@shared/types";
import TurndownService from 'turndown';
const turndownService = new TurndownService();
// A simple worker-side NLP function
const workerExtractTags = (text: string, n = 5): string[] => {
  if (!text) return [];
  const stopWords = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'of', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'can', 'could', 'may', 'might', 'must', 'about', 'above', 'after', 'before', 'from', 'into', 'out', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'just', 'don', 'now', 'it', 'its', 'this', 'that', 'i', 'you', 'he', 'she', 'we', 'they']);
  const words = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').split(/\s+/);
  const freq: Record<string, number> = {};
  words.forEach(w => {
    if (w.length > 2 && !stopWords.has(w) && isNaN(Number(w))) {
      freq[w] = (freq[w] || 0) + 1;
    }
  });
  return Object.entries(freq).sort(([,a],[,b]) => b-a).slice(0, n).map(([word]) => word);
};
const workerFindLinks = (text: string, existingDocs: { id: string; title: string }[], selfId: string): { docId: string; title: string }[] => {
  if (!text || !existingDocs.length) return [];
  const lowerText = text.toLowerCase();
  const foundLinks: { docId: string; title: string }[] = [];
  const addedIds = new Set<string>();
  for (const doc of existingDocs) {
    if (doc.id === selfId || doc.title.length < 4) continue;
    const lowerTitle = doc.title.toLowerCase();
    if (lowerText.includes(lowerTitle) && !addedIds.has(doc.id)) {
      foundLinks.push({ docId: doc.id, title: doc.title });
      addedIds.add(doc.id);
    }
  }
  return foundLinks;
};
async function updateBacklinks(env: Env, updatedDoc: Document) {
  const { items: allDocs } = await DocumentEntity.list(env);
  const allDocsInfo = allDocs.map(d => ({ id: d.id, title: d.title }));
  // Update other docs that now link to the updatedDoc
  for (const doc of allDocs) {
    if (doc.id === updatedDoc.id) continue;
    const links = workerFindLinks(doc.body, [updatedDoc], doc.id);
    if (links.length > 0) {
      const entity = new DocumentEntity(env, doc.id);
      await entity.mutate(s => ({
        ...s,
        backlinks: Array.from(new Set([...(s.backlinks || []), { docId: updatedDoc.id, title: updatedDoc.title }].map(l => l.docId))).map(id => ({ docId: id, title: allDocsInfo.find(d => d.id === id)?.title || '' }))
      }));
    }
  }
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.get('/api/docs', async (c) => {
    await DocumentEntity.ensureSeed(c.env);
    const { items } = await DocumentEntity.list(c.env);
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
      backlinks: [],
    };
    await DocumentEntity.create(c.env, newDoc);
    await updateBacklinks(c.env, newDoc);
    return ok(c, newDoc);
  });
  app.get('/api/docs/:id', async (c) => {
    const id = c.req.param('id');
    const docEntity = new DocumentEntity(c.env, id);
    if (!await docEntity.exists()) return notFound(c, 'document not found');
    const doc = await docEntity.getState();
    return ok(c, doc);
  });
  app.put('/api/docs/:id', async (c) => {
    const id = c.req.param('id');
    const { title, body, tags } = await c.req.json<Partial<Document>>();
    const doc = new DocumentEntity(c.env, id);
    if (!await doc.exists()) return notFound(c, 'document not found');
    const updatedDoc = await doc.mutate(current => ({
      ...current,
      title: title?.trim() ?? current.title,
      body: body?.trim() ?? current.body,
      tags: tags ?? workerExtractTags((title ?? current.title) + ' ' + (body ?? current.body)),
      updatedAt: Date.now(),
    }));
    await updateBacklinks(c.env, updatedDoc);
    return ok(c, updatedDoc);
  });
  app.delete('/api/docs/:id', async (c) => {
    const id = c.req.param('id');
    const deleted = await DocumentEntity.delete(c.env, id);
    return ok(c, { id, deleted });
  });
  app.post('/api/docs/import', async (c) => {
    const payload = await c.req.json<ImportPayload>();
    if (!payload || !payload.items || !Array.isArray(payload.items)) return bad(c, 'Invalid payload');
    let itemsToProcess = payload.items;
    if (payload.source === 'url') {
      const fetchedItems = await Promise.all(payload.items.slice(0, 10).map(async item => {
        if (!item.origin) return null;
        try {
          const res = await fetch(item.origin);
          if (!res.ok) return null;
          const html = await res.text();
          const body = turndownService.turndown(html);
          const titleMatch = html.match(/<title>(.*?)<\/title>/i);
          const title = titleMatch ? titleMatch[1] : item.title;
          return { title, body, origin: item.origin };
        } catch {
          return null;
        }
      }));
      itemsToProcess = fetchedItems.filter(Boolean) as { title: string; body: string; origin?: string }[];
    }
    const createdDocs: Document[] = [];
    for (const item of itemsToProcess) {
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
  app.get('/api/docs/export', async (c) => {
    const ids = c.req.query('ids')?.split(',');
    const format = c.req.query('format') || 'json';
    if (!ids || ids.length === 0) return bad(c, 'No document IDs provided');
    const docs = (await Promise.all(ids.map(async id => {
      const doc = new DocumentEntity(c.env, id);
      return await doc.exists() ? doc.getState() : null;
    }))).filter(Boolean) as Document[];
    if (format === 'md') {
      const content = docs.map(d => `# ${d.title}\n\n${d.body}`).join('\n\n---\n\n');
      return ok(c, { content });
    }
    return c.json(docs);
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