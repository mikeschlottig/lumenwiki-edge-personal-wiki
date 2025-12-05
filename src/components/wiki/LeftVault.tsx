import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { FileText, Tag, Settings, PlusCircle, Home, Star, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { motion } from "framer-motion";
import { useHotkeys } from 'react-hotkeys-hook';
import { useRef } from "react";
export function LeftVault() {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { data: tags, isLoading } = useQuery<{ name: string; count: number }[]>({
    queryKey: ['tags'],
    queryFn: () => api('/api/docs/tags'),
  });
  useHotkeys('mod+k', (e) => {
    e.preventDefault();
    searchInputRef.current?.focus();
  }, { preventDefault: true });
  useHotkeys('mod+n', (e) => {
    e.preventDefault();
    navigate('/editor/new');
  }, { preventDefault: true });
  return (
    <Sidebar>
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2 px-2 py-1">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600" />
          <span className="text-lg font-semibold font-display">LumenWiki</span>
        </Link>
        <div className="px-2 pt-2 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search (⌘K)"
            className="pl-8"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value) {
                navigate(`/search?q=${e.currentTarget.value}`);
                e.currentTarget.blur();
              }
            }}
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/"><motion.span whileHover={{ scale: 1.05 }} className="flex items-center"><Home className="mr-2" /> <span>Dashboard</span></motion.span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/editor/new"><motion.span whileHover={{ scale: 1.05 }} className="flex items-center"><PlusCircle className="mr-2" /> <span>New Note (⌘N)</span></motion.span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/import"><motion.span whileHover={{ scale: 1.05 }} className="flex items-center"><FileText className="mr-2" /> <span>Import</span></motion.span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/settings"><motion.span whileHover={{ scale: 1.05 }} className="flex items-center"><Settings className="mr-2" /> <span>Settings</span></motion.span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Top Tags</SidebarGroupLabel>
          <SidebarMenu>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <SidebarMenuItem key={i}>
                  <div className="h-5 w-2/3 bg-muted rounded animate-pulse ml-8" />
                </SidebarMenuItem>
              ))
            ) : (
              tags?.map((tag) => (
                <SidebarMenuItem key={tag.name}>
                  <SidebarMenuButton asChild>
                    <Link to={`/search?tag=${tag.name}`}><Tag className="mr-2" /> <span>{tag.name}</span></Link>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>{tag.count}</SidebarMenuBadge>
                </SidebarMenuItem>
              ))
            )}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
            <SidebarGroupLabel>Saved Filters</SidebarGroupLabel>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                        <Link to="/search?tag=react"><Star className="mr-2" /><span>React Docs</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                        <Link to="/search?date=7d"><Star className="mr-2" /><span>Updated This Week</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}