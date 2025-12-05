// A lightweight, client-side NLP utility to mirror worker logic for instant UX feedback.
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'of', 'by',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'should', 'can', 'could', 'may', 'might', 'must', 'about', 'above', 'after',
  'before', 'from', 'into', 'out', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
  'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  's', 't', 'just', 'don', 'now', 'it', 'its', 'this', 'that', 'i', 'you', 'he', 'she', 'we', 'they'
]);
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove punctuation except hyphens
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word) && isNaN(Number(word)));
}
/**
 * Extracts the top N tags from a given text based on term frequency.
 * @param text The input text body.
 * @param n The number of top tags to return.
 * @returns An array of suggested tags.
 */
export function extractTags(text: string, n = 5): string[] {
  if (!text || text.trim().length < 20) {
    return [];
  }
  const tokens = tokenize(text);
  const termFrequency: Record<string, number> = {};
  for (const token of tokens) {
    termFrequency[token] = (termFrequency[token] || 0) + 1;
  }
  return Object.entries(termFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([term]) => term);
}
/**
 * Finds potential links to other documents based on title matches.
 * @param text The input text body.
 * @param existingDocs An array of documents to link against.
 * @returns An array of documents that are potentially linked.
 */
export function findLinks(text: string, existingDocs: { id: string; title: string }[]): { docId: string; title: string }[] {
  if (!text || !existingDocs.length) {
    return [];
  }
  const lowerText = text.toLowerCase();
  const foundLinks: { docId: string; title: string }[] = [];
  const addedIds = new Set<string>();
  for (const doc of existingDocs) {
    if (doc.title.length < 4) continue;
    const lowerTitle = doc.title.toLowerCase();
    if (lowerText.includes(lowerTitle) && !addedIds.has(doc.id)) {
      foundLinks.push({ docId: doc.id, title: doc.title });
      addedIds.add(doc.id);
    }
  }
  return foundLinks;
}