import React from "react";
import { Factory } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Route } from "./+types/fila";
import { listarEncomendas, type Encomenda } from "~/lib/api";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { DataTable } from "~/components/ui/data-table";
import { cn } from "~/lib/utils";

export const handle = { title: "Fila de Produção" };

export function meta({}: Route.MetaArgs) {
  return [{ title: "Fila de Produção — Empac" }];
}

const ESTAGIOS: Record<number, { label: string; className: string }> = {
  0: { label: "Na Fila",        className: "border-slate-300  bg-slate-50  text-slate-600"  },
  1: { label: "Coordenação",    className: "border-blue-300   bg-blue-50   text-blue-700"   },
  2: { label: "UniEx",          className: "border-orange-300 bg-orange-50 text-orange-700" },
  3: { label: "UniFlexo",       className: "border-purple-300 bg-purple-50 text-purple-700" },
  4: { label: "UniCorte",       className: "border-amber-300  bg-amber-50  text-amber-700"  },
  5: { label: "UniPac",         className: "border-green-300  bg-green-50  text-green-700"  },
  6: { label: "UniMat",         className: "border-teal-300   bg-teal-50   text-teal-700"   },
  7: { label: "Entregue parte", className: "border-sky-300    bg-sky-50    text-sky-700"    },
  8: { label: "Entregue tudo",  className: "border-emerald-300 bg-emerald-50 text-emerald-700" },
};

const PIPELINE = [
  { id: 0, short: "Fila"    },
  { id: 1, short: "Coord"   },
  { id: 2, short: "UniEx"   },
  { id: 3, short: "Flexo"   },
  { id: 4, short: "Corte"   },
  { id: 5, short: "UniPac"  },
  { id: 6, short: "UniMat"  },
  { id: 7, short: "Parcial" },
  { id: 8, short: "Entregue"},
];

function PipelineBarra({ estado }: { estado: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center">
        {PIPELINE.map((s, i) => (
          <React.Fragment key={s.id}>
            {i > 0 && (
              <div
                className={cn(
                  "h-px w-2.5 flex-shrink-0",
                  s.id <= estado ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <div
              title={s.short}
              className={cn(
                "flex-shrink-0 rounded-full transition-all",
                s.id < estado  && "h-1.5 w-1.5 bg-primary",
                s.id === estado && "h-2.5 w-2.5 bg-primary ring-2 ring-primary ring-offset-1 ring-offset-background",
                s.id > estado  && "h-1.5 w-1.5 bg-border",
              )}
            />
          </React.Fragment>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {ESTAGIOS[estado]?.label ?? String(estado)}
      </p>
    </div>
  );
}

const qty = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });

export async function loader({}: Route.LoaderArgs) {
  return listarEncomendas({ abertos: true });
}

const columns: ColumnDef<Encomenda>[] = [
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
      <div>
        <p className="font-medium leading-tight">{row.original.produto}</p>
        <p className="text-xs text-muted-foreground">{row.original.unidade}</p>
      </div>
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
    header: "Pedido",
    size: 96,
    cell: ({ row }) => {
      const [y, m, d] = row.original.dataPedido.split("-");
      return <span className="text-sm tabular-nums">{d}/{m}/{y}</span>;
    },
  },
  {
    accessorKey: "qtdPedida",
    header: "Qtd pedida",
    size: 120,
    meta: { className: "text-right", headerClassName: "text-right" },
    cell: ({ row }) => (
      <span className="font-mono text-sm tabular-nums">
        {qty.format(row.original.qtdPedida)}{" "}
        <span className="text-xs text-muted-foreground">{row.original.unidade}</span>
      </span>
    ),
  },
  {
    accessorKey: "estado",
    header: "Pipeline",
    size: 220,
    enableSorting: false,
    cell: ({ row }) => <PipelineBarra estado={row.original.estado} />,
  },
];

export default function Fila({ loaderData }: Route.ComponentProps) {
  const { encomendas, total } = loaderData;

  const [estadoFiltro, setEstadoFiltro] = React.useState<string>("todos");

  const dados =
    estadoFiltro === "todos"
      ? encomendas
      : encomendas.filter((e) => String(e.estado) === estadoFiltro);

  const contsPorEstagio = React.useMemo(() => {
    const map: Record<number, number> = {};
    for (const e of encomendas) map[e.estado] = (map[e.estado] ?? 0) + 1;
    return map;
  }, [encomendas]);

  const estagiosPresentes = Object.keys(contsPorEstagio)
    .map(Number)
    .sort((a, b) => a - b);

  const toolbar = (
    <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
      <SelectTrigger className="w-44">
        <SelectValue placeholder="Estágio" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todos">Todos os estágios</SelectItem>
        {estagiosPresentes.map((est) => (
          <SelectItem key={est} value={String(est)}>
            {ESTAGIOS[est]?.label ?? String(est)} ({contsPorEstagio[est]})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Factory className="size-6" />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Fila de Produção
          </h1>
          <p className="text-sm text-muted-foreground">
            Encomendas abertas ordenadas por número do pedido.
          </p>
        </div>
        <Badge variant="secondary">{total} em aberto</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {estagiosPresentes.map((est) => {
          const cfg = ESTAGIOS[est];
          return (
            <Card
              key={est}
              className={cn(
                "cursor-pointer transition-shadow hover:shadow-md",
                estadoFiltro === String(est) && "ring-2 ring-primary",
              )}
              onClick={() =>
                setEstadoFiltro((v) => (v === String(est) ? "todos" : String(est)))
              }
            >
              <CardHeader className="pb-1 pt-3">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {cfg?.label ?? String(est)}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-2xl font-bold tabular-nums">
                  {contsPorEstagio[est]}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={dados}
            searchPlaceholder="Buscar produto, cliente..."
            emptyMessage="Nenhuma encomenda encontrada."
            pageSize={25}
            toolbar={toolbar}
          />
        </CardContent>
      </Card>
    </main>
  );
}
