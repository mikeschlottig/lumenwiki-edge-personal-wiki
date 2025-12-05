import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Loader2 } from 'lucide-react';
import { Document } from '@shared/types';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { useState } from 'react';
export function SettingsPage() {
  const [isExporting, setIsExporting] = useState<'json' | 'md' | null>(null);
  const { data: docs, isLoading: isLoadingDocs } = useQuery<Document[]>({
    queryKey: ['docs'],
    queryFn: () => api('/api/docs'),
  });
  const { data: tags, isLoading: isLoadingTags } = useQuery<{ name: string; count: number }[]>({
    queryKey: ['tags'],
    queryFn: () => api('/api/docs/tags'),
  });
  const handleExport = async (format: 'json' | 'md') => {
    if (!docs || docs.length === 0) {
      toast.warning('No documents to export.');
      return;
    }
    setIsExporting(format);
    try {
      const allIds = docs.map(d => d.id).join(',');
      const response = await fetch(`/api/docs/export?ids=${allIds}&format=${format}`);
      if (!response.ok) throw new Error('Export failed');
      if (format === 'json') {
        const blob = await response.blob();
        saveAs(blob, 'lumen-wiki-export.json');
      } else {
        const { content } = await response.json();
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        saveAs(blob, 'lumen-wiki-export.md');
      }
      toast.success(`Vault exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('An error occurred during export.');
      console.error(error);
    } finally {
      setIsExporting(null);
    }
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <header className="mb-12">
          <h1 className="text-4xl font-display font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your wiki and export your data.</p>
        </header>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Export Vault</CardTitle>
              <CardDescription>Download all your documents in various formats.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button onClick={() => handleExport('json')} disabled={!!isExporting}>
                {isExporting === 'json' ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />}
                Export as JSON
              </Button>
              <Button onClick={() => handleExport('md')} disabled={!!isExporting} variant="secondary">
                {isExporting === 'md' ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />}
                Export as Markdown
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Vault Stats</CardTitle>
              <CardDescription>A quick overview of your knowledge base.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Documents:</span>
                {isLoadingDocs ? <div className="h-5 w-8 bg-muted rounded animate-pulse" /> : <strong>{docs?.length ?? 0}</strong>}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Top Tag:</span>
                {isLoadingTags ? <div className="h-5 w-16 bg-muted rounded animate-pulse" /> : <strong>{tags?.[0]?.name ?? 'N/A'}</strong>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}