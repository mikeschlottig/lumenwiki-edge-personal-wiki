import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Download, Loader2 } from 'lucide-react';
import { Document } from '@shared/types';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
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
  const sourceData = useMemo(() => {
    if (!docs) return [];
    const counts: Record<string, number> = {};
    docs.forEach(doc => {
      const source = doc.source || 'unknown';
      counts[source] = (counts[source] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [docs]);
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
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Export Vault</CardTitle>
              <CardDescription>Download all your documents in various formats.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button onClick={() => handleExport('json')} disabled={!!isExporting} aria-label="Export as JSON">
                {isExporting === 'json' ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />}
                Export as JSON
              </Button>
              <Button onClick={() => handleExport('md')} disabled={!!isExporting} variant="secondary" aria-label="Export as Markdown">
                {isExporting === 'md' ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />}
                Export as Markdown
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Mock Authentication</CardTitle>
              <CardDescription>Demo credentials for display purposes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input value="demo@lumenwiki.com" readOnly />
              <Input type="password" value="password123" readOnly />
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Vault Stats</CardTitle>
              <CardDescription>A quick overview of your knowledge base.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="space-y-4">
                <div className="flex justify-between text-lg">
                  <span className="text-muted-foreground">Total Documents:</span>
                  {isLoadingDocs ? <Skeleton className="h-6 w-12" /> : <strong className="font-mono">{docs?.length ?? 0}</strong>}
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-muted-foreground">Top Tag:</span>
                  {isLoadingTags ? <Skeleton className="h-6 w-24" /> : <strong className="font-mono">{tags?.[0]?.name ?? 'N/A'}</strong>}
                </div>
              </div>
              <div>
                <h4 className="text-center font-medium mb-2">Documents by Source</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}