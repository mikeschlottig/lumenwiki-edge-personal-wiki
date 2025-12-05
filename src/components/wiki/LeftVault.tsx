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
import { FileText, Tag, Settings, PlusCircle, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
export function LeftVault() {
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
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/"><Home /> <span>Dashboard</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/editor/new"><PlusCircle /> <span>New Note</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/import"><FileText /> <span>Import</span></Link>
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
                  <div className="h-5 w-2/3 bg-muted rounded animate-pulse" />
                </SidebarMenuItem>
              ))
            ) : (
              tags?.map((tag) => (
                <SidebarMenuItem key={tag.name}>
                  <SidebarMenuButton asChild>
                    <a href="#"><Tag /> <span>{tag.name}</span></a>
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