import { Link } from "react-router";
import { Users } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Route } from "./+types/clientes";
import { listarClientes } from "~/lib/api";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { DataTable } from "~/components/ui/data-table";

export const handle = { title: "Clientes" };

export function meta({}: Route.MetaArgs) {
  return [{ title: "Clientes — Empac" }];
}

export async function loader({}: Route.LoaderArgs) {
  const data = await listarClientes({ limite: 100000 });
  return data;
}

function formatarCnpj(cnpj: string) {
  if (!cnpj || cnpj.length !== 14) return cnpj || "—";
  return cnpj.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  );
}

type Cliente = Route.ComponentProps["loaderData"]["clientes"][number];

const columns: ColumnDef<Cliente>[] = [
  {
    accessorKey: "id",
    header: "ID",
    size: 80,
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.id}</span>
    ),
  },
  {
    accessorKey: "nome",
    header: "Nome",
    cell: ({ row }) => <span className="font-medium">{row.original.nome}</span>,
  },
  {
    accessorKey: "cidade",
    header: "Cidade",
    cell: ({ row }) => row.original.cidade || "—",
  },
  {
    accessorKey: "uf",
    header: "UF",
    size: 80,
    cell: ({ row }) => row.original.uf || "—",
  },
  {
    accessorKey: "cnpj",
    header: "CNPJ",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{formatarCnpj(row.original.cnpj)}</span>
    ),
  },
  {
    id: "acoes",
    header: "Ações",
    enableSorting: false,
    size: 96,
    meta: { className: "text-right", headerClassName: "text-right" },
    cell: ({ row }) => (
      <Button asChild variant="ghost" size="sm">
        <Link to={`/clientes/${row.original.id}`}>Ver</Link>
      </Button>
    ),
  },
];

export default function Clientes({ loaderData }: Route.ComponentProps) {
  const { clientes, total } = loaderData;

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Users className="size-6" />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Listagem consultada da API.
          </p>
        </div>
        <Badge variant="secondary">{total} cliente(s)</Badge>
      </div>

      <Card>
        <CardContent>
          <DataTable
            columns={columns}
            data={clientes}
            searchPlaceholder="Buscar por nome, cidade, UF, CNPJ..."
            emptyMessage="Nenhum cliente encontrado."
          />
        </CardContent>
      </Card>
    </main>
  );
}
