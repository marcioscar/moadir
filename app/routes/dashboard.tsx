import { Form, Link, useNavigation } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";
import type { Route } from "./+types/dashboard";
import { ChartPrejuizos } from "~/components/chart-prejuizos";
import { SectionCards } from "~/components/section-cards";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { DataTable } from "~/components/ui/data-table";
import { listarClientes, obterRelatorio } from "~/lib/api";

export const handle = { title: "Dashboard" };

export function meta({}: Route.MetaArgs) {
  return [{ title: "Dashboard — Empac" }];
}

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const dini = url.searchParams.get("dini") ?? "2026-05-01";
  const dfim = url.searchParams.get("dfim") ?? "2026-12-31";

  const [relatorio, baseClientes] = await Promise.all([
    obterRelatorio({ dini, dfim }),
    listarClientes({ limite: 100000 }),
  ]);

  const maior = relatorio.clientes.reduce<{
    nome: string;
    total: number;
  } | null>((acc, c) => (acc === null || c.total < acc.total ? c : acc), null);

  return {
    dini,
    dfim,
    clientes: relatorio.clientes,
    resumo: {
      totalClientes: baseClientes.total,
      totalGeral: relatorio.totalGeral,
      clientesComPrejuizo: relatorio.clientes.length,
      maiorPrejuizo: maior,
    },
  };
}

type LinhaPrejuizo = Route.ComponentProps["loaderData"]["clientes"][number];

const columns: ColumnDef<LinhaPrejuizo>[] = [
  {
    accessorKey: "id",
    header: "ID",
    size: 96,
    cell: ({ row }) => (
      <Link to={`/clientes/${row.original.id}`} className="hover:underline">
        {row.original.id}
      </Link>
    ),
  },
  {
    accessorKey: "nome",
    header: "Cliente",
    cell: ({ row }) => <span className="font-medium">{row.original.nome}</span>,
  },
  {
    accessorKey: "total",
    header: "Prejuízo",
    meta: { className: "text-right", headerClassName: "text-right" },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums text-destructive">
        {brl.format(row.original.total)}
      </span>
    ),
  },
];

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { resumo, clientes, dini, dfim } = loaderData;
  const navigation = useNavigation();
  const carregando = navigation.state === "loading";

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <Form method="get" className="flex flex-wrap items-end gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium" htmlFor="dini">
                  Início
                </label>
                <Input id="dini" name="dini" type="date" defaultValue={dini} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium" htmlFor="dfim">
                  Fim
                </label>
                <Input id="dfim" name="dfim" type="date" defaultValue={dfim} />
              </div>
              <Button type="submit" disabled={carregando}>
                {carregando ? "Atualizando..." : "Atualizar"}
              </Button>
            </Form>
          </div>

          <SectionCards resumo={resumo} />

          <div className="px-4 lg:px-6">
            <ChartPrejuizos
              data={clientes.map((c) => ({
                nome: c.nome,
                total: c.total,
              }))}
            />
          </div>

          <div className="px-4 lg:px-6">
            <Card>
              <CardHeader>
                <CardTitle>Prejuízo por cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={columns}
                  data={clientes}
                  searchPlaceholder="Buscar cliente..."
                  emptyMessage="Nenhum registro no período."
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
