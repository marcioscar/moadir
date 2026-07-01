import React from "react";
import { useFetcher, Link } from "react-router";
import { Factory, TrendingUp, TrendingDown, FileSpreadsheet, Pencil } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Route } from "./+types/fila";
import {
  listarEncomendas,
  type Encomenda,
  type EncomendaDetalhe,
  type MovimentoGSF,
  type PlanilhaCusto,
} from "~/lib/api";
import { requireUsuario } from "~/lib/auth.server";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { DataTable } from "~/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import { Skeleton } from "~/components/ui/skeleton";
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

const TIPO_MOV: Record<number, string> = {
  1: "Entrada",
  2: "Saída",
  3: "Transferência",
  4: "Devolução",
  5: "Ajuste",
  6: "Cancelamento",
};

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

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const pct = new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });
const qty = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });

function ValorComparativo({
  label,
  valor,
  destaque,
}: {
  label: string;
  valor: number;
  destaque?: "positivo" | "negativo" | "neutro";
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-lg font-semibold tabular-nums",
          destaque === "positivo" && "text-emerald-600",
          destaque === "negativo" && "text-red-600",
        )}
      >
        {brl.format(valor)}
      </p>
    </div>
  );
}

function DetalheDialog({
  encomenda,
  onClose,
}: {
  encomenda: Encomenda | null;
  onClose: () => void;
}) {
  const fetcher = useFetcher<EncomendaDetalhe>();
  const planilhaFetcher = useFetcher<PlanilhaCusto>();

  React.useEffect(() => {
    if (encomenda) {
      fetcher.load(`/api/encomendas/detalhe?id=${encomenda.id}`);
      planilhaFetcher.load(`/api/planilha?id=${encomenda.id}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encomenda?.id]);

  const detalhe = fetcher.data;
  const carregando = fetcher.state === "loading";

  const resumo = planilhaFetcher.data?.resumo;
  const carregandoPlanilha = planilhaFetcher.state === "loading";
  const temPlanilha = !!resumo && (resumo.vendasTotal > 0 || resumo.direto > 0);

  const progresso =
    encomenda && encomenda.qtdPedida > 0
      ? encomenda.qtdProduzida / encomenda.qtdPedida
      : 0;

  return (
    <Dialog open={!!encomenda} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        {encomenda && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-muted-foreground">
                    #{String(encomenda.id).padStart(4, "0")}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", ESTAGIOS[encomenda.estado]?.className)}
                  >
                    {ESTAGIOS[encomenda.estado]?.label}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/encomendas/${encomenda.id}/editar`}>
                      <Pencil className="size-3.5" />
                      Editar
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/planilha/${encomenda.id}`}>
                      <FileSpreadsheet className="size-3.5" />
                      Planilha de Custo
                    </Link>
                  </Button>
                </div>
              </div>
              <DialogTitle>{encomenda.produto}</DialogTitle>
              <DialogDescription>{encomenda.clienteNome}</DialogDescription>
            </DialogHeader>

            {/* Progresso */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Progresso de produção</span>
                <span className="tabular-nums text-muted-foreground">
                  {qty.format(encomenda.qtdProduzida)} / {qty.format(encomenda.qtdPedida)}{" "}
                  {encomenda.unidade} — {pct.format(progresso)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(progresso * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Comparativo financeiro — números reais da planilha de custo (materiais + mão de obra + indiretos + impostos) */}
            {carregandoPlanilha ? (
              <div className="rounded-lg border p-4">
                <Skeleton className="h-20 w-full" />
              </div>
            ) : !temPlanilha ? (
              <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                Sem movimentos de produção registrados para apurar custo.
              </div>
            ) : (
              <div className="rounded-lg border p-4">
                <p className="mb-3 text-sm font-medium">Comparativo financeiro (Planilha de Custo)</p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <ValorComparativo
                    label="Valor a faturar"
                    valor={resumo!.vendasTotal / 100}
                  />
                  <ValorComparativo
                    label="Custo total"
                    valor={resumo!.total / 100}
                  />
                  <ValorComparativo
                    label="Resultado"
                    valor={resumo!.resultado / 100}
                    destaque={resumo!.resultado >= 0 ? "positivo" : "negativo"}
                  />
                  <ValorComparativo
                    label="Custo direto"
                    valor={resumo!.direto / 100}
                    destaque="neutro"
                  />
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  {resumo!.resultado >= 0 ? (
                    <TrendingUp className="size-3.5 text-emerald-600" />
                  ) : (
                    <TrendingDown className="size-3.5 text-red-600" />
                  )}
                  <span>
                    {resumo!.resultado >= 0 ? "Lucro" : "Prejuízo"} de{" "}
                    {resumo!.vendasTotal > 0
                      ? pct.format(Math.abs(resumo!.resultado) / resumo!.vendasTotal)
                      : "—"}{" "}
                    · Materiais/M.O. {brl.format(resumo!.direto / 100)} · Indiretos+impostos{" "}
                    {brl.format((resumo!.total - resumo!.direto) / 100)}
                  </span>
                </div>
              </div>
            )}

            {/* Detalhes complementares */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Data do pedido</p>
                <p>
                  {encomenda.dataPedido
                    ? (() => {
                        const [y, m, d] = encomenda.dataPedido.split("-");
                        return `${d}/${m}/${y}`;
                      })()
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Embalagem</p>
                <p>{encomenda.embalagem > 0 ? `${encomenda.embalagem} un` : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Peso total</p>
                <p>{encomenda.pesoKg > 0 ? `${encomenda.pesoKg} kg` : "—"}</p>
              </div>
            </div>

            {/* Movimentos GSF */}
            <div>
              <p className="mb-2 text-sm font-medium">
                Movimentos de produção (G.S.)
              </p>
              {carregando ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : detalhe?.movimentos && detalhe.movimentos.length > 0 ? (
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Data</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Produto</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Qtd</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Un</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Tipo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {detalhe.movimentos.map((mov: MovimentoGSF) => {
                        const [y, m, d] = mov.data.split("-");
                        return (
                          <tr key={mov.seq} className="hover:bg-muted/30">
                            <td className="px-3 py-1.5 tabular-nums text-muted-foreground">
                              {d}/{m}/{y}
                            </td>
                            <td className="px-3 py-1.5">{mov.produtoNome || `#${mov.produtoId}`}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums">
                              {qty.format(mov.quantidade)}
                            </td>
                            <td className="px-3 py-1.5 text-muted-foreground">{mov.unidade}</td>
                            <td className="px-3 py-1.5 text-muted-foreground">
                              {TIPO_MOV[mov.tipo] ?? `Tipo ${mov.tipo}`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {detalhe ? "Nenhum movimento registrado." : "Carregando..."}
                </p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUsuario(request);
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
  const [encomendaAberta, setEncomendaAberta] = React.useState<Encomenda | null>(null);

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
            onRowClick={setEncomendaAberta}
          />
        </CardContent>
      </Card>

      <DetalheDialog
        encomenda={encomendaAberta}
        onClose={() => setEncomendaAberta(null)}
      />
    </main>
  );
}
