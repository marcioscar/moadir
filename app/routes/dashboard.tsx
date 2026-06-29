import { Link, redirect } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";
import type { Route } from "./+types/dashboard";
import { listarEncomendas } from "~/lib/api";
import { requireUsuario } from "~/lib/auth.server";
import { ChartEstagio } from "~/components/chart-estagio";
import { ChartTopClientes } from "~/components/chart-top-clientes";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { DataTable } from "~/components/ui/data-table";
import { Badge } from "~/components/ui/badge";
import { FactoryIcon, PackageIcon, ScaleIcon, CalendarClockIcon } from "lucide-react";

export const handle = { title: "Dashboard" };

export function meta({}: Route.MetaArgs) {
  return [{ title: "Dashboard — Empac" }];
}

const ESTAGIO_NOME: Record<number, string> = {
  0: "Na Fila", 1: "Coord.", 2: "UniEx", 3: "Flexo",
  4: "Corte",   5: "UniPac", 6: "UniMat",
};

const qty = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUsuario(request);
  // Operadores não têm acesso ao dashboard — vão direto para a fila
  if (user.role === "operador") throw redirect("/fila");

  const { encomendas, total } = await listarEncomendas({ abertos: true });

  const pesoTotal = encomendas.reduce((s, e) => s + e.pesoKg, 0);

  const clientesMap = new Map<number, string>();
  for (const e of encomendas) clientesMap.set(e.clienteId, e.clienteNome.trim());
  const clientesAtivos = clientesMap.size;

  const pedidoMaisAntigo = encomendas.reduce<string | null>(
    (oldest, e) => (!oldest || e.dataPedido < oldest ? e.dataPedido : oldest),
    null,
  );
  const diasAguardando = pedidoMaisAntigo
    ? Math.floor(
        (Date.now() - new Date(pedidoMaisAntigo).getTime()) / 86_400_000,
      )
    : 0;

  const porEstagioMap: Record<number, number> = {};
  for (const e of encomendas) porEstagioMap[e.estado] = (porEstagioMap[e.estado] ?? 0) + 1;
  const chartEstagio = [0, 1, 2, 3, 4, 5, 6].map((id) => ({
    estagio: ESTAGIO_NOME[id],
    count: porEstagioMap[id] ?? 0,
  }));

  const porClienteMap: Record<number, { cliente: string; count: number }> = {};
  for (const e of encomendas) {
    if (!porClienteMap[e.clienteId]) {
      porClienteMap[e.clienteId] = { cliente: e.clienteNome.trim(), count: 0 };
    }
    porClienteMap[e.clienteId].count++;
  }
  const topClientes = Object.values(porClienteMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((c) => ({
      ...c,
      cliente:
        c.cliente.length > 30 ? c.cliente.slice(0, 30) + "…" : c.cliente,
    }));

  const maisAntigos = [...encomendas]
    .sort((a, b) => a.dataPedido.localeCompare(b.dataPedido))
    .slice(0, 8);

  return {
    total,
    pesoTotal,
    clientesAtivos,
    diasAguardando,
    pedidoMaisAntigo,
    chartEstagio,
    topClientes,
    maisAntigos,
  };
}

type EncomendaRow = Route.ComponentProps["loaderData"]["maisAntigos"][number];

const columns: ColumnDef<EncomendaRow>[] = [
  {
    accessorKey: "id",
    header: "Nº",
    size: 72,
    cell: ({ row }) => (
      <span className="font-mono text-sm text-muted-foreground">
        {String(row.original.id).padStart(4, "0")}
      </span>
    ),
  },
  {
    accessorKey: "produto",
    header: "Produto",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.produto}</span>
    ),
  },
  {
    accessorKey: "clienteNome",
    header: "Cliente",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.clienteNome}</span>
    ),
  },
  {
    accessorKey: "dataPedido",
    header: "Data pedido",
    size: 110,
    cell: ({ row }) => {
      const [y, m, d] = row.original.dataPedido.split("-");
      return <span className="tabular-nums text-sm">{d}/{m}/{y}</span>;
    },
  },
  {
    accessorKey: "estadoNome",
    header: "Estágio",
    size: 130,
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.estadoNome}</Badge>
    ),
  },
];

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const {
    total,
    pesoTotal,
    clientesAtivos,
    diasAguardando,
    chartEstagio,
    topClientes,
    maisAntigos,
  } = loaderData;

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">

          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Encomendas em aberto</CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums">
                  {total}
                </CardTitle>
              </CardHeader>
              <CardFooter className="text-sm text-muted-foreground">
                <FactoryIcon className="mr-1.5 size-4" />
                Na fila de produção
              </CardFooter>
            </Card>

            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Peso total em produção</CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums">
                  {qty.format(pesoTotal)} kg
                </CardTitle>
              </CardHeader>
              <CardFooter className="text-sm text-muted-foreground">
                <ScaleIcon className="mr-1.5 size-4" />
                Soma de todos os pedidos abertos
              </CardFooter>
            </Card>

            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Clientes ativos</CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums">
                  {clientesAtivos}
                </CardTitle>
              </CardHeader>
              <CardFooter className="text-sm text-muted-foreground">
                <PackageIcon className="mr-1.5 size-4" />
                Com pelo menos 1 pedido em aberto
              </CardFooter>
            </Card>

            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Pedido mais antigo</CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums">
                  {diasAguardando}d
                </CardTitle>
              </CardHeader>
              <CardFooter className="text-sm text-muted-foreground">
                <CalendarClockIcon className="mr-1.5 size-4" />
                Dias desde o pedido mais antigo
              </CardFooter>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @3xl/main:grid-cols-2">
            <ChartEstagio data={chartEstagio} />
            <ChartTopClientes data={topClientes} />
          </div>

          {/* Tabela: pedidos mais antigos */}
          <div className="px-4 lg:px-6">
            <Card>
              <CardHeader>
                <CardTitle>Pedidos mais antigos em aberto</CardTitle>
                <CardDescription>
                  Ordenados por data do pedido — os que aguardam há mais tempo.{" "}
                  <Link to="/fila" className="underline underline-offset-2">
                    Ver fila completa →
                  </Link>
                </CardDescription>
              </CardHeader>
              <DataTable
                columns={columns}
                data={maisAntigos}
                searchPlaceholder="Buscar..."
                emptyMessage="Sem pedidos em aberto."
                pageSize={8}
              />
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
