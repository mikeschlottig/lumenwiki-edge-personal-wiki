import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Tag } from 'lucide-react';
export interface PreviewItem {
  id: string;
  title: string;
  body: string;
  origin?: string;
  tags: string[];
  isDuplicate: boolean;
  selected: boolean;
}
interface ImportPreviewProps {
  previews: PreviewItem[];
  onSelectionChange: (id: string, selected: boolean) => void;
}
export function ImportPreview({ previews, onSelectionChange }: ImportPreviewProps) {
  if (!previews.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Drop files or paste URLs to see a preview here.</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {previews.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          whileHover={{ y: -3, boxShadow: '0 8px 15px rgba(0,0,0,0.07)' }}
        >
          <Card className={`transition-all ${item.selected ? 'ring-2 ring-primary' : ''} ${item.isDuplicate ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : ''}`}>
            <CardHeader className="flex flex-row items-start gap-4 space-y-0">
              <Checkbox
                checked={item.selected}
                onCheckedChange={(checked) => onSelectionChange(item.id, !!checked)}
                className="mt-1"
                aria-label={`Select ${item.title}`}
              />
              <div className="flex-grow">
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>
                  {item.origin ? (
                    <a href={item.origin} target="_blank" rel="noopener noreferrer" className="hover:underline truncate block max-w-md">
                      {item.origin}
                    </a>
                  ) : 'Pasted or uploaded content'}
                </CardDescription>
              </div>
              {item.isDuplicate && (
                <Badge variant="destructive" className="gap-1.5 items-center flex-shrink-0">
                  <AlertTriangle className="size-3.5" />
                  Duplicate
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {item.body.substring(0, 150)}{item.body.length > 150 ? '...' : ''}
              </p>
              <div className="flex flex-wrap gap-2 items-center">
                <Tag className="size-4 text-muted-foreground" />
                {item.tags.length > 0 ? (
                  item.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)
                ) : (
                  <span className="text-xs text-muted-foreground">No tags suggested</span>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}