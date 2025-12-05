import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Document } from '@shared/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster, toast } from 'sonner';
import { ArrowLeft, Save, Trash2, Eye, Code, Loader2, Download, Link2, CircleDot } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useDebounce } from 'react-use';
import { motion, AnimatePresence } from 'framer-motion';
import { saveAs } from 'file-saver';
import { extractTags } from '@/lib/worker-nlp';
import nlp from 'compromise';
import { useHotkeys } from 'react-hotkeys-hook';
export function WikiEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'new';
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showBacklinks, setShowBacklinks] = useState(true);
  const initialTitleRef = useRef('');
  const initialBodyRef = useRef('');
  const { data: doc, isLoading } = useQuery<Document>({
    queryKey: ['doc', id],
    queryFn: () => api(`/api/docs/${id}`),
    enabled: !isNew,
  });
  const backlinkIds = doc?.backlinks?.map(b => b.docId) ?? [];
  const backlinkQueries = useQueries({
    queries: backlinkIds.map(backlinkId => ({
      queryKey: ['doc', backlinkId],
      queryFn: () => api<Document>(`/api/docs/${backlinkId}`),
    })),
  });
  useEffect(() => {
    if (doc) {
      setTitle(doc.title);
      setBody(doc.body);
      setTags(doc.tags);
      initialTitleRef.current = doc.title;
      initialBodyRef.current = doc.body;
      setIsDirty(false);
    } else if (isNew) {
      const defaultTitle = 'Untitled Note';
      setTitle(defaultTitle);
      setBody('');
      setTags([]);
      initialTitleRef.current = defaultTitle;
      initialBodyRef.current = '';
      setIsDirty(true);
    }
  }, [doc, isNew]);
  useEffect(() => {
    if (!isNew) {
      const dirty = title !== initialTitleRef.current || body !== initialBodyRef.current;
      setIsDirty(dirty);
    }
  }, [title, body, isNew]);
  useEffect(() => {
    const toastId = 'dirty-toast';
    if (isDirty) {
      toast.info('Unsaved changes', { duration: 2000, id: toastId });
    } else {
      toast.dismiss(toastId);
    }
    return () => {
      toast.dismiss(toastId);
    };
  }, [isDirty]);
  const mutation = useMutation({
    mutationFn: (updatedDoc: Partial<Document> & { id?: string }) => {
      setIsSaving(true);
      if (isNew) {
        return api<Document>('/api/docs', { method: 'POST', body: JSON.stringify(updatedDoc) });
      }
      return api<Document>(`/api/docs/${id}`, { method: 'PUT', body: JSON.stringify(updatedDoc) });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['docs'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.setQueryData(['doc', data.id], data);
      initialTitleRef.current = data.title;
      initialBodyRef.current = data.body;
      setIsDirty(false);
      if (isNew) {
        navigate(`/editor/${data.id}`, { replace: true });
      }
      setTimeout(() => setIsSaving(false), 500);
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
      setIsSaving(false);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: () => api(`/api/docs/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Document deleted');
      queryClient.invalidateQueries({ queryKey: ['docs'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      navigate('/');
    },
    onError: (error) => toast.error(`Failed to delete: ${error.message}`),
  });
  const exportMutation = useMutation({
    mutationFn: async (format: 'md' | 'json') => {
      const res = await fetch(`/api/docs/export?ids=${id}&format=${format}`);
      if (!res.ok) throw new Error('Export failed');
      if (format === 'md') {
        const data = await res.json();
        return { blob: new Blob([data.data.content], { type: 'text/markdown;charset=utf-8' }), format };
      }
      const data = await res.json();
      return { blob: new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), format };
    },
    onSuccess: ({ blob, format }) => {
      saveAs(blob, `${title}.${format}`);
      toast.success('Document exported!');
    },
    onError: (error) => toast.error(`Export failed: ${error.message}`),
  });
  const handleAutoSave = useCallback(() => {
    if (isLoading || !isDirty) return;
    const baseTags = extractTags(title + ' ' + body);
    const nounTags = nlp(title + ' ' + body).nouns().out('array').slice(0, 5);
    const combined = Array.from(new Set([...baseTags, ...nounTags]));
    mutation.mutate({ title, body, tags: combined });
  }, [title, body, isLoading, isDirty, mutation]);
  useDebounce(handleAutoSave, 2000, [title, body]);
  useHotkeys('mod+s', (e) => {
    e.preventDefault();
    if (!isSaving) handleAutoSave();
  }, { preventDefault: true });
  useHotkeys('escape', () => setShowPreview(p => !p), { preventDefault: true });
  const getStatusIcon = () => {
    if (isSaving) return <><Loader2 className="size-4 animate-spin" /> Saving...</>;
    if (isDirty) return <><CircleDot className="size-4 text-blue-500" /> Unsaved</>;
    return <><Save className="size-4" /> Saved</>;
  };
  if (isLoading && !isNew) {
    return <div className="center h-screen"><Loader2 className="size-8 animate-spin" /></div>;
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <header className="flex items-center justify-between mb-6 gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}><ArrowLeft className="size-5" /></Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
            {getStatusIcon()}
            {doc && <span className="hidden sm:inline">| Updated {format(new Date(doc.updatedAt), "MMM d, h:mm a")}</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowBacklinks(!showBacklinks)}><Link2 className="mr-2 size-4" />Backlinks</Button>
            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>{showPreview ? <Code className="mr-2 size-4" /> : <Eye className="mr-2 size-4" />}{showPreview ? 'Edit' : 'Preview'}</Button>
            {!isNew && <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate()}><Trash2 className="mr-2 size-4" />Delete</Button>}
          </div>
        </header>
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note Title" className="text-4xl font-bold h-auto border-none focus-visible:ring-0 shadow-none px-0" />
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
            </div>
            <div className={`grid grid-cols-1 ${showPreview ? '' : 'lg:grid-cols-2'} gap-8 min-h-[60vh]`}>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Start writing..." className={`h-full resize-none text-lg leading-relaxed p-4 rounded-lg ${showPreview ? 'hidden' : ''}`} />
              <div className={`prose dark:prose-invert max-w-none p-4 rounded-lg bg-muted/50 ${showPreview ? '' : 'hidden lg:block'}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{body || "Preview will appear here."}</ReactMarkdown>
              </div>
            </div>
          </div>
          <AnimatePresence>
            {showBacklinks && !isNew && (
              <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Linked Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-3/4" /></div>
                    ) : backlinkQueries.some(q => q.isLoading) ? (
                      <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
                    ) : backlinkQueries.length > 0 ? (
                      <ul className="space-y-2">
                        {backlinkQueries.map(q => q.data && (
                          <li key={q.data.id}>
                            <Link to={`/editor/${q.data.id}`} className="block p-2 rounded-md hover:bg-accent">
                              <p className="font-medium text-sm">{q.data.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{q.data.body.replace(/#/g, '')}</p>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No documents link here yet.</p>
                    )}
                    <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => exportMutation.mutate('md')} disabled={exportMutation.isPending}>
                      {exportMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />}
                      Export this Note
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
      <Toaster />
    </div>
  );
}