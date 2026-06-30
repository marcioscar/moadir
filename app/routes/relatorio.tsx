import React from "react";
import { Form, Link, useNavigate, useNavigation } from "react-router";
import { FileBarChart, FileSpreadsheet } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Route } from "./+types/relatorio";
import { listarEncomendas, obterRelatorio, type Encomenda } from "~/lib/api";
import { requireMinRole } from "~/lib/auth.server";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

export const handle = { title: "Relatório de prejuízo" };

export function meta({}: Route.MetaArgs) {
  return [{ title: "Relatório de prejuízo — Empac" }];
}

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export async function loader({ request }: Route.LoaderArgs) {
  await requireMinRole(request, "gerente");
  const url = new URL(request.url);
  const dini = url.searchParams.get("dini") ?? "2000-01-01";
  const dfim = url.searchParams.get("dfim") ?? "2030-12-31";

  const data = await obterRelatorio({ dini, dfim });

  // Encomendas terminadas mais recentes: limita a busca ao ciclo atual de
  // numeração (a partir do maior id em aberto), já que ids antigos de ciclos
  // de numeração anteriores também ficam marcados como "Entregue tudo".
  const abertas = await listarEncomendas({ abertos: true, limite: 1, desc: true });
  const idMax = abertas.encomendas[0]?.id;
  const terminadasResp = await listarEncomendas({
    estado: 8,
    limite: 8,
    desc: true,
    idMax,
  });

  return { ...data, dini, dfim, terminadas: terminadasResp.encomendas };
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

function fmtData(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function PlanilhaBusca({ terminadas }: { terminadas: Encomenda[] }) {
  const navigate = useNavigate();
  const [id, setId] = React.useState("");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Planilha de Custo de Encomendado</CardTitle>
          <CardDescription>
            Informe o número da encomenda para abrir a planilha detalhada
            (materiais, mão de obra, custos indiretos, impostos e resultado).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-wrap items-end gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(id);
              if (n > 0) navigate(`/planilha/${n}`);
            }}
          >
            <div className="space-y-1">
              <label className="text-xs font-medium" htmlFor="encomendaId">
                Nº da encomenda
              </label>
              <Input
                id="encomendaId"
                type="number"
                min={1}
                placeholder="Ex.: 4758"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-40"
              />
            </div>
            <Button type="submit" disabled={!id}>
              <FileSpreadsheet className="size-4" />
              Abrir planilha
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimas Encomendas Terminadas</CardTitle>
          <CardDescription>Pedidos com entrega concluída, do mais recente para o mais antigo.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {terminadas.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">
              Nenhuma encomenda terminada encontrada.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-y bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Nº</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Data</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Produto</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Cliente</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {terminadas.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/30">
                    <td className="px-4 py-1.5 font-mono tabular-nums">E{e.id}</td>
                    <td className="px-4 py-1.5 tabular-nums text-muted-foreground">{fmtData(e.dataPedido)}</td>
                    <td className="px-4 py-1.5">{e.produto}</td>
                    <td className="px-4 py-1.5 text-muted-foreground">{e.clienteNome}</td>
                    <td className="px-4 py-1.5 text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/planilha/${e.id}`}>
                          <FileSpreadsheet className="size-3.5" />
                          Planilha
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Relatorio({ loaderData }: Route.ComponentProps) {
  const { clientes, totalGeral, dini, dfim, terminadas } = loaderData;
  const navigation = useNavigation();
  const carregando = navigation.state === "loading";

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <FileBarChart className="size-6" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
          <p className="text-sm text-muted-foreground">
            Prejuízo por cliente e consulta de planilhas de custo por encomenda.
          </p>
        </div>
      </div>

      <Tabs defaultValue="planilha">
        <TabsList>
          <TabsTrigger value="planilha">Planilha de Custo</TabsTrigger>
          <TabsTrigger value="prejuizo">Prejuízo por Cliente</TabsTrigger>
        </TabsList>

        <TabsContent value="planilha">
          <PlanilhaBusca terminadas={terminadas} />
        </TabsContent>

        <TabsContent value="prejuizo" className="space-y-6">
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
        </TabsContent>
      </Tabs>
    </main>
  );
}
