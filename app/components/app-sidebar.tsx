import * as React from "react"
import { NavLink } from "react-router"
import {
  LayoutDashboardIcon,
  UsersIcon,
  FileChartColumnIcon,
  PackageIcon,
  TrendingDown,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar"

const navItems = [
  { title: "Dashboard", url: "/", end: true, icon: LayoutDashboardIcon },
  { title: "Clientes", url: "/clientes", end: false, icon: UsersIcon },
  { title: "Produtos", url: "/produtos", end: false, icon: PackageIcon },
  { title: "Planilhas DCP", url: "/prejuizos", end: false, icon: TrendingDown },
  { title: "Relatório", url: "/relatorio", end: false, icon: FileChartColumnIcon },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="p-2">
        <NavLink
          to="/"
          className="flex items-center rounded-md px-1.5 py-1 transition-opacity hover:opacity-80"
        >
          <img
            src="/LogoEmpac1.png"
            alt="Empac Agroindustrial de Plásticos"
            className="h-12 w-auto object-contain dark:brightness-0 dark:invert"
          />
        </NavLink>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.end}
                      className={({ isActive }) =>
                        isActive ? "bg-sidebar-accent font-medium" : ""
                      }
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
