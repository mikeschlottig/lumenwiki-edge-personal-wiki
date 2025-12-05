import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { ImportPayload } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Upload, ClipboardPaste, Link as LinkIcon, Loader2 } from 'lucide-react';
export function ImportPage() {
  const [pasteContent, setPasteContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (payload: ImportPayload) => api('/api/docs/import', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: (data: { createdCount: number }) => {
      toast.success(`${data.createdCount} document(s) imported successfully!`);
      queryClient.invalidateQueries({ queryKey: ['docs'] });
      navigate('/');
    },
    onError: (error) => toast.error(`Import failed: ${error.message}`),
  });
  const handlePasteImport = () => {
    if (!pasteContent.trim()) {
      toast.warning('Please paste some content to import.');
      return;
    }
    const title = pasteContent.split('\n')[0].replace(/^#+\s*/, '').trim() || 'Pasted Note';
    const payload: ImportPayload = {
      source: 'paste',
      items: [{ title, body: pasteContent }],
    };
    mutation.mutate(payload);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  const handleFileUpload = () => {
    if (!file) {
      toast.warning('Please select a file to upload.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const body = e.target?.result as string;
      const title = file.name.replace(/\.(md|txt)$/i, '');
      const payload: ImportPayload = {
        source: 'upload',
        items: [{ title, body }],
      };
      mutation.mutate(payload);
    };
    reader.readAsText(file);
  };
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold">Import Content</h1>
          <p className="text-muted-foreground mt-2">Bring your notes into LumenWiki from various sources.</p>
        </header>
        <Card>
          <CardContent className="p-0">
            <Tabs defaultValue="paste" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="paste"><ClipboardPaste className="mr-2 size-4" />Paste Text</TabsTrigger>
                <TabsTrigger value="upload"><Upload className="mr-2 size-4" />Upload File</TabsTrigger>
              </TabsList>
              <TabsContent value="paste" className="p-6 space-y-4">
                <p className="text-sm text-muted-foreground">Paste your content below. The first line will be used as the title.</p>
                <Textarea
                  placeholder="Paste your markdown or text here..."
                  className="min-h-[300px] font-mono"
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                />
                <Button onClick={handlePasteImport} disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Import from Paste
                </Button>
              </TabsContent>
              <TabsContent value="upload" className="p-6 space-y-4">
                <p className="text-sm text-muted-foreground">Upload a Markdown (.md) or Text (.txt) file.</p>
                <Input type="file" accept=".md,.txt" onChange={handleFileChange} />
                {file && <p className="text-sm">Selected: {file.name}</p>}
                <Button onClick={handleFileUpload} disabled={mutation.isPending || !file}>
                  {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Upload and Import
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}