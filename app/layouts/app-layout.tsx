import { NavLink, Outlet, useLoaderData, useMatches } from "react-router";
import type { Route } from "./+types/app-layout";
import { requireUsuario, type Usuario } from "~/lib/auth.server";
import { AppMenubar } from "~/components/app-menubar";

type Handle = { title?: string };

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUsuario(request);
  return {
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
    } satisfies Pick<Usuario, "id" | "nome" | "email" | "role">,
  };
}

export default function AppLayout() {
  const { user } = useLoaderData<typeof loader>();
  const matches = useMatches();
  const title =
    [...matches]
      .reverse()
      .map((m) => (m.handle as Handle | undefined)?.title)
      .find(Boolean) ?? "moadir";

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="flex h-20 items-center gap-3 px-6">
          <NavLink to="/" className="flex-shrink-0 transition-opacity hover:opacity-80">
            <img
              src="/LogoEmpac1.png"
              alt="Empac Agroindustrial de Plásticos"
              className="h-14 w-auto object-contain dark:brightness-0 dark:invert"
            />
          </NavLink>
          <div className="h-5 w-px bg-border" />
          <AppMenubar user={user} />
          <div className="flex-1" />
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
