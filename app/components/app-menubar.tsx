import { useNavigate, useLocation } from "react-router";
import {
  UsersIcon,
  PackageIcon,
  FactoryIcon,
  Settings2,
  TrendingDown,
  FileChartColumnIcon,
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

const GRUPOS = [
  {
    label: "Cadastros",
    prefixos: ["/clientes", "/produtos"],
    itens: [
      { label: "Clientes", path: "/clientes", icon: UsersIcon },
      { label: "Produtos", path: "/produtos",  icon: PackageIcon },
    ],
  },
  {
    label: "Produção",
    prefixos: ["/fila", "/atualizacao"],
    itens: [
      { label: "Fila de Produção",  path: "/fila",        icon: FactoryIcon },
      { label: "Atualizar Estágio", path: "/atualizacao", icon: Settings2   },
    ],
  },
  {
    label: "Relatórios",
    prefixos: ["/prejuizos", "/relatorio"],
    itens: [
      { label: "Planilhas DCP", path: "/prejuizos", icon: TrendingDown },
      { label: "Relatório",     path: "/relatorio",  icon: FileChartColumnIcon },
    ],
  },
] as const;

export function AppMenubar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <Menubar className="border-none bg-transparent p-0 shadow-none">
      {GRUPOS.map((grupo) => {
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
    </Menubar>
  );
}
