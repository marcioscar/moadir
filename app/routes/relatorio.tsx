import { Form, Link, useNavigation } from "react-router";
import { FileBarChart } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Route } from "./+types/relatorio";
import { obterRelatorio } from "~/lib/api";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { DataTable } from "~/components/ui/data-table";

export const handle = { title: "Relatório de prejuízo" };

export function meta({}: Route.MetaArgs) {
  return [{ title: "Relatório de prejuízo — Empac" }];
}

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const dini = url.searchParams.get("dini") ?? "2000-01-01";
  const dfim = url.searchParams.get("dfim") ?? "2030-12-31";

  const data = await obterRelatorio({ dini, dfim });
  return { ...data, dini, dfim };
}

type LinhaRelatorio = Route.ComponentProps["loaderData"]["clientes"][number];

const columns: ColumnDef<LinhaRelatorio>[] = [
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

export default function Relatorio({ loaderData }: Route.ComponentProps) {
  const { clientes, totalGeral, dini, dfim } = loaderData;
  const navigation = useNavigation();
  const carregando = navigation.state === "loading";

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <FileBarChart className="size-6" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Relatório de prejuízo
          </h1>
          <p className="text-sm text-muted-foreground">
            Prejuízo por cliente no período, com total geral.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Período</CardTitle>
          <CardDescription>Selecione a data inicial e final.</CardDescription>
        </CardHeader>
        <CardContent>
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
              {carregando ? "Gerando..." : "Gerar"}
            </Button>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <DataTable
            columns={columns}
            data={clientes}
            searchPlaceholder="Buscar cliente..."
            emptyMessage="Nenhum registro no período."
            toolbar={
              <Badge variant="destructive">
                Total geral: {brl.format(totalGeral)}
              </Badge>
            }
            footer={
              clientes.length > 0 ? (
                <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-2.5 text-sm font-semibold">
                  <span>Total geral</span>
                  <span className="font-mono tabular-nums">
                    {brl.format(totalGeral)}
                  </span>
                </div>
              ) : null
            }
          />
        </CardContent>
      </Card>
    </main>
  );
}
