import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Toaster } from "@/components/ui/sonner";
import { Plus, Upload } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Document } from "@shared/types";
import { DocCard, DocCardSkeleton } from "@/components/wiki/DocCard";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useRef, useEffect } from "react";
export function HomePage() {
  const { data: docs, isLoading: isLoadingDocs } = useQuery<Document[]>({
    queryKey: ['docs'],
    queryFn: () => api('/api/docs'),
  });
  const { data: tags, isLoading: isLoadingTags } = useQuery<{ name: string; count: number }[]>({
    queryKey: ['tags'],
    queryFn: () => api('/api/docs/tags'),
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current && docs?.length === 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        ctx.strokeStyle = 'hsl(var(--primary))';
        ctx.lineWidth = 2;
        // Simple book icon
        ctx.beginPath();
        ctx.moveTo(20, 10);
        ctx.lineTo(20, 118);
        ctx.lineTo(108, 118);
        ctx.lineTo(108, 10);
        ctx.lineTo(20, 10);
        ctx.moveTo(64, 10);
        ctx.lineTo(64, 118);
        ctx.stroke();
      }
    }
  }, [docs]);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <ThemeToggle className="fixed top-4 right-4" />
      <div className="py-8 md:py-10 lg:py-12">
        <header className="space-y-6 mb-16 text-center">
          <div className="relative inline-block">
            <div className="absolute -inset-2 bg-gradient-mesh opacity-20 blur-2xl rounded-full" />
            <h1 className="text-5xl md:text-6xl font-display font-bold text-balance leading-tight relative">
              LumenWiki
            </h1>
          </div>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Your personal wiki, supercharged by the edge.
            <br />
            Automatic tagging, linking, and always available.
          </p>
          <div className="flex justify-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
              <Button size="lg" asChild>
                <Link to="/editor/new">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Note
                </Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
              <Button size="lg" variant="outline" asChild>
                <Link to="/import">
                  <Upload className="mr-2 h-5 w-5" />
                  Import Content
                </Link>
              </Button>
            </motion.div>
          </div>
        </header>
        <main className="space-y-16">
          <section>
            <h2 className="text-3xl font-semibold mb-8">Recent Documents</h2>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {isLoadingDocs
                ? Array.from({ length: 3 }).map((_, i) => <DocCardSkeleton key={i} />)
                : docs && docs.length > 0
                ? docs.slice(0, 6).map((doc) => <DocCard key={doc.id} doc={doc} />)
                : (
                  <motion.div
                    className="col-span-full text-center py-12 bg-muted/50 rounded-2xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <canvas ref={canvasRef} className="mx-auto w-32 h-32 mb-4 opacity-50" />
                    <h3 className="text-xl font-medium">Your wiki is empty!</h3>
                    <p className="text-muted-foreground mt-2">Create your first note to get started.</p>
                  </motion.div>
                )}
            </motion.div>
          </section>
          <section>
            <h2 className="text-3xl font-semibold mb-8 text-center">Top Tags</h2>
            <div className="flex flex-wrap gap-3 justify-center max-w-3xl mx-auto">
              {isLoadingTags ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-8 w-24 bg-muted rounded-full animate-pulse" />
                ))
              ) : (
                tags?.map(t => (
                  <motion.div key={t.name} whileHover={{ scale: 1.1 }}>
                    <Badge variant="secondary" className="text-sm px-4 py-1 cursor-pointer">
                      <Link to={`/search?tag=${t.name}`}>{t.name} ({t.count})</Link>
                    </Badge>
                  </motion.div>
                ))
              )}
            </div>
          </section>
        </main>
        <footer className="text-center mt-24 text-muted-foreground/80">
          <p>Built with ❤️ at Cloudflare</p>
        </footer>
      </div>
      <Toaster richColors closeButton />
    </div>
  );
}