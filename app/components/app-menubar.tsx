import { Form, useNavigate, useLocation } from "react-router";
import {
  UsersIcon,
  PackageIcon,
  FactoryIcon,
  Settings2,
  TrendingDown,
  FileChartColumnIcon,
  ShieldIcon,
  LogOutIcon,
  UserCircle2Icon,
} from "lucide-react";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "~/components/ui/menubar";
import { cn } from "~/lib/utils";
import { ROLE_LABEL, ROLE_LEVEL, type Role } from "~/lib/roles";

type UserInfo = { id: string; nome: string; email: string; role: Role };

const GRUPOS = [
  {
    label: "Cadastros",
    prefixos: ["/clientes", "/produtos"],
    minRole: "gerente" as Role,
    itens: [
      { label: "Clientes", path: "/clientes", icon: UsersIcon },
      { label: "Produtos", path: "/produtos", icon: PackageIcon },
    ],
  },
  {
    label: "Produção",
    prefixos: ["/fila", "/atualizacao"],
    minRole: "operador" as Role,
    itens: [
      { label: "Fila de Produção", path: "/fila", icon: FactoryIcon },
      { label: "Atualizar Estágio", path: "/atualizacao", icon: Settings2 },
    ],
  },
  {
    label: "Relatórios",
    prefixos: ["/prejuizos", "/relatorio"],
    minRole: "gerente" as Role,
    itens: [
      { label: "Planilhas DCP", path: "/prejuizos", icon: TrendingDown },
      { label: "Relatório", path: "/relatorio", icon: FileChartColumnIcon },
    ],
  },
] as const;

interface Props {
  user: UserInfo;
}

export function AppMenubar({ user }: Props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const nivel = ROLE_LEVEL[user.role];

  const gruposVisiveis = GRUPOS.filter((g) => nivel >= ROLE_LEVEL[g.minRole]);

  return (
    <div className="flex items-center gap-1">
      <Menubar className="border-none bg-transparent p-0 shadow-none">
        {gruposVisiveis.map((grupo) => {
          const ativo = grupo.prefixos.some((p) => pathname.startsWith(p));
          return (
            <MenubarMenu key={grupo.label}>
              <MenubarTrigger
                className={cn(
                  "cursor-pointer text-sm",
                  ativo && "bg-accent font-medium text-accent-foreground",
                )}
              >
                {grupo.label}
              </MenubarTrigger>
              <MenubarContent>
                {grupo.itens.map((item, i) => (
                  <span key={item.path}>
                    {i > 0 && <MenubarSeparator />}
                    <MenubarItem
                      onClick={() => navigate(item.path)}
                      className={cn(
                        "cursor-pointer gap-2",
                        pathname.startsWith(item.path) &&
                          "bg-accent text-accent-foreground",
                      )}
                    >
                      <item.icon className="size-4 text-muted-foreground" />
                      {item.label}
                    </MenubarItem>
                  </span>
                ))}
              </MenubarContent>
            </MenubarMenu>
          );
        })}

        {/* Menu de Administração (apenas admin) */}
        {user.role === "admin" && (
          <MenubarMenu>
            <MenubarTrigger
              className={cn(
                "cursor-pointer text-sm",
                pathname.startsWith("/admin") && "bg-accent font-medium text-accent-foreground",
              )}
            >
              Administração
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem
                onClick={() => navigate("/admin/usuarios")}
                className={cn(
                  "cursor-pointer gap-2",
                  pathname.startsWith("/admin/usuarios") && "bg-accent text-accent-foreground",
                )}
              >
                <ShieldIcon className="size-4 text-muted-foreground" />
                Usuários
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        )}
      </Menubar>

      {/* Menu do usuário logado */}
      <Menubar className="border-none bg-transparent p-0 shadow-none">
        <MenubarMenu>
          <MenubarTrigger className="cursor-pointer gap-1.5 text-sm">
            <UserCircle2Icon className="size-4 text-muted-foreground" />
            <span className="max-w-28 truncate">{user.nome}</span>
          </MenubarTrigger>
          <MenubarContent align="end">
            <div className="px-2 py-1.5">
              <p className="text-xs font-medium">{user.nome}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                {ROLE_LABEL[user.role]}
              </span>
            </div>
            <MenubarSeparator />
            <MenubarItem asChild>
              <Form method="post" action="/logout">
                <button
                  type="submit"
                  className="flex w-full cursor-pointer items-center gap-2 text-sm text-destructive"
                >
                  <LogOutIcon className="size-4" />
                  Sair
                </button>
              </Form>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  );
}
