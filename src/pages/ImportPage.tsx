import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';
import { api } from '@/lib/api-client';
import { Document, ImportPayload } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, ClipboardPaste, Link as LinkIcon, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { extractTags } from '@/lib/worker-nlp';
import { ImportPreview, PreviewItem } from '@/components/wiki/ImportPreview';
export function ImportPage() {
  const [pasteContent, setPasteContent] = useState('');
  const [urls, setUrls] = useState('');
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: existingDocs } = useQuery<Document[]>({
    queryKey: ['docs'],
    queryFn: () => api('/api/docs'),
    initialData: [],
  });
  const mutation = useMutation({
    mutationFn: (payload: ImportPayload) => api('/api/docs/import', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: (data: { createdCount: number }) => {
      toast.success(`${data.createdCount} document(s) imported successfully!`);
      queryClient.invalidateQueries({ queryKey: ['docs'] });
      navigate('/');
    },
    onError: (error) => toast.error(`Import failed: ${error.message}`),
  });
  const createPreviews = useCallback((items: { title: string; body: string; origin?: string }[]): PreviewItem[] => {
    const existingTitles = new Set(existingDocs?.map(doc => doc.title.toLowerCase()));
    return items.map(item => ({
      id: uuidv4(),
      title: item.title,
      body: item.body,
      origin: item.origin,
      tags: extractTags(`${item.title}\n${item.body}`),
      isDuplicate: existingTitles.has(item.title.toLowerCase()),
      selected: true,
    }));
  }, [existingDocs]);
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setIsProcessing(true);
    const filePromises = acceptedFiles.map(file => new Promise<{ title: string; body: string }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onabort = () => reject(new Error('File reading was aborted.'));
      reader.onerror = () => reject(new Error('File reading has failed.'));
      reader.onload = () => {
        const body = reader.result as string;
        const title = file.name.replace(/\.(md|txt|docx)$/i, '');
        resolve({ title, body });
      };
      reader.readAsText(file);
    }));
    Promise.all(filePromises).then(results => {
      setPreviews(createPreviews(results));
      setIsProcessing(false);
    }).catch(error => {
      toast.error(error.message);
      setIsProcessing(false);
    });
  }, [createPreviews]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/markdown': ['.md'], 'text/plain': ['.txt'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
  });
  const handlePasteImport = () => {
    if (!pasteContent.trim()) return toast.warning('Please paste some content.');
    const title = pasteContent.split('\n')[0].replace(/^#+\s*/, '').trim() || 'Pasted Note';
    setPreviews(createPreviews([{ title, body: pasteContent }]));
  };
  const handleUrlPreview = () => {
    const urlList = urls.split(/[\n,]+/).map(u => u.trim()).filter(Boolean);
    if (!urlList.length) return toast.warning('Please enter at least one URL.');
    // For this phase, we'll simulate the preview client-side.
    // A full implementation would call a backend endpoint to fetch and parse.
    toast.info("URL import processing will be handled by the worker. This is a client-side preview.");
    const urlPreviews = urlList.map(url => ({
        title: new URL(url).hostname,
        body: `Content will be fetched from ${url} upon import.`,
        origin: url
    }));
    setPreviews(createPreviews(urlPreviews));
  };
  const handleSelectionChange = (id: string, selected: boolean) => {
    setPreviews(prev => prev.map(p => p.id === id ? { ...p, selected } : p));
  };
  const handleConfirmImport = () => {
    const selectedPreviews = previews.filter(p => p.selected);
    if (selectedPreviews.length === 0) return toast.warning('No items selected for import.');
    const payload: ImportPayload = {
      source: 'upload', // This can be refined based on active tab
      items: selectedPreviews.map(({ title, body, origin }) => ({ title, body, origin })),
    };
    mutation.mutate(payload);
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold">Import Content</h1>
          <p className="text-muted-foreground mt-2">Bring your notes into LumenWiki from various sources.</p>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="lg:col-span-1">
            <CardContent className="p-0">
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="upload"><Upload className="mr-2 size-4" />Upload</TabsTrigger>
                  <TabsTrigger value="paste"><ClipboardPaste className="mr-2 size-4" />Paste</TabsTrigger>
                  <TabsTrigger value="urls"><LinkIcon className="mr-2 size-4" />URLs</TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="p-6">
                  <div {...getRootProps()} className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                    <input {...getInputProps()} />
                    <Upload className="mx-auto size-12 text-muted-foreground mb-4" />
                    {isDragActive ? <p>Drop the files here ...</p> : <p>Drag 'n' drop files here, or click to select</p>}
                    <p className="text-xs text-muted-foreground mt-2">Supports .md, .txt, .docx (basic text extraction)</p>
                  </div>
                </TabsContent>
                <TabsContent value="paste" className="p-6 space-y-4">
                  <Textarea placeholder="Paste content here..." className="min-h-[200px]" value={pasteContent} onChange={e => setPasteContent(e.target.value)} />
                  <Button onClick={handlePasteImport}>Preview Paste</Button>
                </TabsContent>
                <TabsContent value="urls" className="p-6 space-y-4">
                  <Textarea placeholder="https://example.com/article1&#10;https://example.com/article2" className="min-h-[200px]" value={urls} onChange={e => setUrls(e.target.value)} />
                  <Button onClick={handleUrlPreview}>Preview URLs</Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Import Preview</CardTitle>
                <CardDescription>Select the items you want to import into your vault.</CardDescription>
              </CardHeader>
              <CardContent>
                {isProcessing ? (
                  <div className="center-col h-48"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
                ) : (
                  <ImportPreview previews={previews} onSelectionChange={handleSelectionChange} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        {previews.length > 0 && (
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <Button size="lg" onClick={handleConfirmImport} disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle className="mr-2 size-4" />}
                Confirm Import ({previews.filter(p => p.selected).length} selected)
              </Button>
              <Button size="lg" variant="outline" onClick={() => setPreviews([])}>
                <XCircle className="mr-2 size-4" /> Cancel
              </Button>
            </div>
            {mutation.isPending && <Progress value={50} className="w-full max-w-md mt-2 animate-pulse" />}
          </div>
        )}
      </div>
    </div>
  );
}