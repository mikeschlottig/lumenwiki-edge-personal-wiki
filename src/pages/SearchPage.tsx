import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Document } from '@shared/types';
import { Input } from '@/components/ui/input';
import { DocCard, DocCardSkeleton } from '@/components/wiki/DocCard';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import nlp from 'compromise';
import { subDays } from 'date-fns';
export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const tag = searchParams.get('tag') || '';
  const dateRange = searchParams.get('date') || '';
  // For simplicity, we'll stick to client-side filtering.
  // A full useInfiniteQuery would require backend pagination support.
  const { data: docs, isLoading } = useQuery<Document[]>({
    queryKey: ['docs'],
    queryFn: () => api('/api/docs'),
  });
  const { data: tags } = useQuery<{ name: string; count: number }[]>({
    queryKey: ['tags'],
    queryFn: () => api('/api/docs/tags'),
  });
  const filteredDocs = useMemo(() => {
    if (!docs) return [];
    const lowerQuery = query.toLowerCase();
    const expandedQuery = nlp(query).verbs().toInfinitive().out('text') + ' ' + nlp(query).nouns().toSingular().out('text');
    const lowerExpandedQuery = expandedQuery.toLowerCase();
    return docs.filter(doc => {
      const queryMatch = lowerQuery
        ? doc.title.toLowerCase().includes(lowerQuery) ||
          doc.body.toLowerCase().includes(lowerQuery) ||
          doc.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
          doc.body.toLowerCase().includes(lowerExpandedQuery)
        : true;
      const tagMatch = tag ? doc.tags.includes(tag) : true;
      const dateMatch = dateRange ? (() => {
        const docDate = new Date(doc.updatedAt);
        if (dateRange === '24h') return docDate > subDays(new Date(), 1);
        if (dateRange === '7d') return docDate > subDays(new Date(), 7);
        if (dateRange === '30d') return docDate > subDays(new Date(), 30);
        return true;
      })() : true;
      return queryMatch && tagMatch && dateMatch;
    });
  }, [docs, query, tag, dateRange]);
  const handleFilterChange = (type: 'q' | 'tag' | 'date', value: string) => {
    setSearchParams(prev => {
      if (value) {
        prev.set(type, value);
      } else {
        prev.delete(type);
      }
      return prev;
    });
  };
  const sources = useMemo(() => {
    if (!docs) return [];
    return [...new Set(docs.map(d => d.source).filter(Boolean))] as string[];
  }, [docs]);
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <header className="mb-12">
          <h1 className="text-4xl font-display font-bold">Search & Filter</h1>
          <p className="text-muted-foreground mt-2">Find exactly what you're looking for in your wiki.</p>
          <Input
            type="search"
            placeholder="Search by keyword, title, or tag..."
            className="mt-4 max-w-lg"
            value={query}
            onChange={e => handleFilterChange('q', e.target.value)}
          />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <aside className="md:col-span-1">
            <div className="sticky top-24 space-y-6">
              <h3 className="text-lg font-semibold">Filters</h3>
              <Accordion type="multiple" defaultValue={['tags', 'date']} className="w-full">
                <AccordionItem value="tags">
                  <AccordionTrigger>Tags</AccordionTrigger>
                  <AccordionContent className="flex flex-col items-start">
                    <Button variant="ghost" onClick={() => handleFilterChange('tag', '')} className={!tag ? 'font-bold' : ''}>All Tags</Button>
                    {tags?.map(t => <Button variant="ghost" onClick={() => handleFilterChange('tag', t.name)} key={t.name} className={tag === t.name ? 'font-bold' : ''}>{t.name}</Button>)}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="date">
                  <AccordionTrigger>Date Updated</AccordionTrigger>
                  <AccordionContent className="flex flex-col items-start">
                    <Button variant="ghost" onClick={() => handleFilterChange('date', '')} className={!dateRange ? 'font-bold' : ''}>Any time</Button>
                    <Button variant="ghost" onClick={() => handleFilterChange('date', '24h')} className={dateRange === '24h' ? 'font-bold' : ''}>Last 24 hours</Button>
                    <Button variant="ghost" onClick={() => handleFilterChange('date', '7d')} className={dateRange === '7d' ? 'font-bold' : ''}>Last 7 days</Button>
                    <Button variant="ghost" onClick={() => handleFilterChange('date', '30d')} className={dateRange === '30d' ? 'font-bold' : ''}>Last 30 days</Button>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </aside>
          <main className="md:col-span-3">
            <h2 className="text-2xl font-semibold mb-6">{filteredDocs.length} Result(s)</h2>
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => <DocCardSkeleton key={i} />)}
              </div>
            ) : filteredDocs.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredDocs.map(doc => <DocCard key={doc.id} doc={doc} />)}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/50 rounded-2xl">
                <h3 className="text-xl font-medium">No documents found</h3>
                <p className="text-muted-foreground mt-2">Try adjusting your search or filters.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}