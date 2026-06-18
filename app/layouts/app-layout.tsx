import { Outlet, useMatches } from "react-router";
import { AppSidebar } from "~/components/app-sidebar";
import { SiteHeader } from "~/components/site-header";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";

type Handle = { title?: string };

export default function AppLayout() {
  const matches = useMatches();
  const title =
    [...matches]
      .reverse()
      .map((m) => (m.handle as Handle | undefined)?.title)
      .find(Boolean) ?? "moadir";

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title={title} />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
