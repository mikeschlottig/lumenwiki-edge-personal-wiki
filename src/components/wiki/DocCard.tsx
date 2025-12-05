import { Document } from "@shared/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FileText, Tag, Clock } from "lucide-react";
interface DocCardProps {
  doc: Document;
}
export function DocCard({ doc }: DocCardProps) {
  const excerpt = doc.body.length > 100 ? doc.body.substring(0, 100) + "..." : doc.body;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5, boxShadow: "0 10px 20px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
    >
      <Link to={`/editor/${doc.id}`} className="block">
        <Card className="h-full flex flex-col rounded-2xl shadow-soft transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-start gap-2 text-xl font-semibold">
              <FileText className="size-5 mt-1 text-muted-foreground flex-shrink-0" />
              <span>{doc.title}</span>
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-xs pt-1">
              <Clock className="size-3" />
              <span>Updated {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground leading-relaxed">{excerpt.replace(/#/g, '')}</p>
          </CardContent>
          <CardFooter>
            <div className="flex flex-wrap gap-2 items-center">
              <Tag className="size-4 text-muted-foreground" />
              {doc.tags.length > 0 ? (
                doc.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="font-normal">
                    {tag}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">No tags</span>
              )}
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}
export function DocCardSkeleton() {
    return (
        <Card className="h-full flex flex-col rounded-2xl shadow-soft">
            <CardHeader>
                <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-muted rounded animate-pulse mt-2" />
            </CardHeader>
            <CardContent>
                <div className="h-4 w-full bg-muted rounded animate-pulse mb-2" />
                <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
            </CardContent>
            <CardFooter>
                <div className="flex flex-wrap gap-2">
                    <div className="h-6 w-16 bg-muted rounded-full animate-pulse" />
                    <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
                </div>
            </CardFooter>
        </Card>
    )
}