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
import { FileText, Tag, Settings, PlusCircle, Home } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { motion } from "framer-motion";
export function LeftVault() {
  const navigate = useNavigate();
  const { data: tags, isLoading } = useQuery<{ name: string; count: number }[]>({
    queryKey: ['tags'],
    queryFn: () => api('/api/docs/tags'),
  });
  return (
    <Sidebar>
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2 px-2 py-1">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600" />
          <span className="text-lg font-semibold font-display">LumenWiki</span>
        </Link>
        <div className="px-2 pt-2">
          <Input 
            placeholder="Search docs..." 
            className="mt-4" 
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value) {
                // In a future phase, this would navigate to a search page.
                // For now, it does nothing to avoid 404s.
                // navigate(`/search?q=${e.currentTarget.value}`)
                console.log("Search functionality to be implemented in a future phase.");
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
                <Link to="/editor/new"><motion.span whileHover={{ scale: 1.05 }} className="flex items-center"><PlusCircle className="mr-2" /> <span>New Note</span></motion.span></Link>
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
                    <a href="#"><Tag className="mr-2" /> <span>{tag.name}</span></a>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>{tag.count}</SidebarMenuBadge>
                </SidebarMenuItem>
              ))
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}