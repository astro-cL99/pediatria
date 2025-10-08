import { Home, Users, FileText, BookOpen, BarChart3, Settings, Upload, Search, Bot, FileCheck, ClipboardList, Bed } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Entrega de Turno", url: "/handover", icon: ClipboardList },
  { title: "Pacientes", url: "/patient/new", icon: Users },
  { title: "Nuevo Ingreso", url: "/admission/new", icon: FileText },
  { title: "Epicrisis", url: "/epicrisis", icon: FileCheck },
  { title: "Carga Documentos", url: "/documents/upload", icon: Upload },
  { title: "Búsqueda IA", url: "/search", icon: Search },
  { title: "Asistente IA", url: "/assistant", icon: Bot },
  { title: "Protocolos", url: "/protocols", icon: BookOpen },
  { title: "Estadísticas", url: "/stats", icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminRole();
  }, []);

  const checkAdminRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    setIsAdmin(!!data);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>PediaMed</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isAdmin && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/beds")}>
                      <NavLink to="/beds">
                        <Bed />
                        <span>Gestión Camas</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname.includes("roles")}>
                      <NavLink to="/dashboard?view=roles">
                        <Settings />
                        <span>Roles</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
