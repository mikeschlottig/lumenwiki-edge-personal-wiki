import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Toaster } from "@/components/ui/sonner";
import { Plus, Upload } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Document } from "@shared/types";
import { DocCard, DocCardSkeleton } from "@/components/wiki/DocCard";
import { Link } from "react-router-dom";
export function HomePage() {
  const { data: docs, isLoading: isLoadingDocs } = useQuery<Document[]>({
    queryKey: ['docs'],
    queryFn: () => api('/api/docs'),
  });
  const { data: tags, isLoading: isLoadingTags } = useQuery<{ name: string; count: number }[]>({
    queryKey: ['tags'],
    queryFn: () => api('/api/docs/tags'),
  });
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
            <Button size="lg" asChild className="transition-transform hover:scale-105">
              <Link to="/editor/new">
                <Plus className="mr-2 h-5 w-5" />
                Create Note
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="transition-transform hover:scale-105">
              <Link to="/import">
                <Upload className="mr-2 h-5 w-5" />
                Import Content
              </Link>
            </Button>
          </div>
        </header>
        <main className="space-y-16">
          <section>
            <h2 className="text-3xl font-semibold mb-8">Recent Documents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {isLoadingDocs
                ? Array.from({ length: 3 }).map((_, i) => <DocCardSkeleton key={i} />)
                : docs && docs.length > 0
                ? docs.slice(0, 6).map((doc) => <DocCard key={doc.id} doc={doc} />)
                : (
                  <div className="col-span-full text-center py-12 bg-muted/50 rounded-2xl">
                    <h3 className="text-xl font-medium">Your wiki is empty!</h3>
                    <p className="text-muted-foreground mt-2">Create your first note to get started.</p>
                  </div>
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