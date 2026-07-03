import { Link } from "react-router";
import { PackagePlus } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Route } from "./+types/consumo";
import { listarEncomendas } from "~/lib/api";
import { requireUsuario } from "~/lib/auth.server";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { DataTable } from "~/components/ui/data-table";

export const handle = { title: "Lançar Consumo" };

export function meta({}: Route.MetaArgs) {
  return [{ title: "Lançar Consumo — Empac" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUsuario(request);
  return listarEncomendas({ abertos: true, desc: true, limite: 2000 });
}

type Encomenda = Route.ComponentProps["loaderData"]["encomendas"][number];

const columns: ColumnDef<Encomenda>[] = [
  {
    accessorKey: "id",
    header: "Nº",
    size: 80,
    cell: ({ row }) => (
      <span className="font-mono text-muted-foreground">
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
  },
  {
    accessorKey: "estadoNome",
    header: "Estágio",
    size: 130,
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.estadoNome}</Badge>
    ),
  },
  {
    id: "acoes",
    header: "",
    size: 160,
    cell: ({ row }) => (
      <Button asChild variant="outline" size="sm">
        <Link to={`/encomendas/${row.original.id}/consumo`}>
          <PackagePlus className="size-3.5" />
          Lançar Consumo
        </Link>
      </Button>
    ),
  },
];

export default function ConsumoPickerPage({
  loaderData,
}: Route.ComponentProps) {
  const { encomendas, total } = loaderData;

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <PackagePlus className="size-6" />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Lançar Consumo
          </h1>
          <p className="text-sm text-muted-foreground">
            Escolha a encomenda pra lançar consumo de material ou hora-máquina.
          </p>
        </div>
        <Badge variant="secondary">{total} em aberto</Badge>
      </div>

      <Card>
        <CardContent>
          <DataTable
            columns={columns}
            data={encomendas}
            searchPlaceholder="Buscar por número, produto, cliente..."
            emptyMessage="Nenhuma encomenda em aberto."
          />
        </CardContent>
      </Card>
    </main>
  );
}
