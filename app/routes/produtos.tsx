import { Package } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Route } from "./+types/produtos";
import { listarProdutos } from "~/lib/api";
import { requireMinRole } from "~/lib/auth.server";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { DataTable } from "~/components/ui/data-table";

export const handle = { title: "Produtos" };

export function meta({}: Route.MetaArgs) {
  return [{ title: "Produtos — Empac" }];
}

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const num = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 3,
});

export async function loader({ request }: Route.LoaderArgs) {
  await requireMinRole(request, "gerente");
  return listarProdutos({ limite: 100000 });
}

type Produto = Route.ComponentProps["loaderData"]["produtos"][number];

const columns: ColumnDef<Produto>[] = [
  {
    accessorKey: "id",
    header: "Item",
    size: 80,
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {String(row.original.id).padStart(4, "0")}
      </span>
    ),
  },
  {
    accessorKey: "descricao",
    header: "Descrição",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.descricao}</span>
    ),
  },
  {
    accessorKey: "unidade",
    header: "Un",
    size: 80,
  },
  {
    accessorKey: "grupo",
    header: "Grupo",
    size: 110,
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.grupo}</span>
    ),
  },
  {
    accessorKey: "custo",
    header: "Custo",
    meta: { className: "text-right", headerClassName: "text-right" },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">
        {brl.format(row.original.custo)}
      </span>
    ),
  },
  {
    accessorKey: "venda",
    header: "Venda",
    meta: { className: "text-right", headerClassName: "text-right" },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">
        {brl.format(row.original.venda)}
      </span>
    ),
  },
  {
    accessorKey: "local",
    header: "Local",
    size: 96,
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.local}</span>
    ),
  },
  {
    accessorKey: "disponivel",
    header: "Disponível",
    meta: { className: "text-right", headerClassName: "text-right" },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">
        {num.format(row.original.disponivel)}
      </span>
    ),
  },
  {
    accessorKey: "reservado",
    header: "Reservado",
    meta: { className: "text-right", headerClassName: "text-right" },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums text-muted-foreground">
        {num.format(row.original.reservado)}
      </span>
    ),
  },
  {
    accessorKey: "estoque",
    header: "Estoque",
    meta: { className: "text-right", headerClassName: "text-right" },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">
        {num.format(row.original.estoque)}{" "}
        <span className="text-xs text-muted-foreground">
          {row.original.unidade}
        </span>
      </span>
    ),
  },
];

export default function Produtos({ loaderData }: Route.ComponentProps) {
  const { produtos, total, semana, fator } = loaderData;
  const multiplicador = (fator / 10000).toLocaleString("pt-BR", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Package className="size-6" />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Produtos</h1>
          <p className="text-sm text-muted-foreground">
            Preços corrigidos pelo fator da semana{" "}
            <span className="font-medium text-foreground">{semana}</span>
            {" "}(×{multiplicador})
          </p>
        </div>
        <Badge variant="secondary">{total} produto(s)</Badge>
      </div>

      <Card>
        <CardContent>
          <DataTable
            columns={columns}
            data={produtos}
            searchPlaceholder="Buscar por descrição, unidade, grupo..."
            emptyMessage="Nenhum produto encontrado."
          />
        </CardContent>
      </Card>
    </main>
  );
}
