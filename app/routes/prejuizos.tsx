import React from "react";
import { Form, Link, useNavigation } from "react-router";
import { ChevronDown, ChevronRight, Download, Printer, TrendingDown } from "lucide-react";
import type { ColumnDef, Row } from "@tanstack/react-table";
import type { Route } from "./+types/prejuizos";
import { listarDcp } from "~/lib/api";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

export const handle = { title: "Planilhas de custo" };

export function meta({}: Route.MetaArgs) {
  return [{ title: "Planilhas de custo — Empac" }];
}

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

type ClienteLinha = {
  clienteId: number;
  clienteNome: string;
  guias: number;
  total: number;
  registros: RegistroLinha[];
};

function gerarImpressao(
  clientes: ClienteLinha[],
  totalGeral: number,
  ini: number,
  fim: number,
  totalSemanas: number,
) {
  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const periodo =
    fim > 0 ? `Semanas ${ini} a ${fim}` : `A partir da semana ${ini}`;
  const emitido = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const logoUrl = `${window.location.origin}/LogoEmpac1.png`;

  const linhas = clientes
    .flatMap((c) => {
      const headerRow = `
        <tr class="cli-header">
          <td colspan="3" class="cli-nome">${c.clienteNome}</td>
          <td class="right subtotal">${fmt(c.total)}</td>
        </tr>`;
      const registroRows = c.registros
        .map(
          (r) => `
        <tr class="reg">
          <td class="sem">Sem.&nbsp;${r.semana}</td>
          <td class="data">${r.data}</td>
          <td class="desc">${r.descricao}</td>
          <td class="right valor">${fmt(r.valor)}</td>
        </tr>`,
        )
        .join("");
      return headerRow + registroRows;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Planilhas de Custo com Prejuízo</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; background: #fff; }

  header { display: flex; align-items: center; gap: 16px; padding: 16px 24px 12px; border-bottom: 2px solid #333; margin-bottom: 16px; }
  header img { height: 52px; width: auto; object-fit: contain; }
  header .info h1 { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
  header .info p { font-size: 10px; color: #555; }

  table { width: 100%; border-collapse: collapse; }
  th { background: #1e293b; color: #fff; font-size: 10px; text-transform: uppercase; letter-spacing: .04em; padding: 5px 8px; text-align: left; }
  th.right { text-align: right; }

  tr.cli-header td { background: #f1f5f9; font-weight: 700; padding: 6px 8px; border-top: 1px solid #cbd5e1; }
  tr.cli-header td.cli-nome { font-size: 11px; }
  tr.cli-header td.subtotal { color: #b91c1c; font-size: 11px; }

  tr.reg td { padding: 3px 8px 3px 16px; border-bottom: 1px solid #e2e8f0; color: #374151; }
  td.sem  { width: 60px; color: #6b7280; }
  td.data { width: 80px; }
  td.desc { }
  td.right { text-align: right; white-space: nowrap; }
  td.valor { color: #b91c1c; font-size: 10.5px; }

  tfoot tr td { background: #1e293b; color: #fff; font-weight: 700; padding: 7px 8px; font-size: 12px; }
  tfoot tr td.right { text-align: right; }

  .meta { font-size: 9.5px; color: #6b7280; padding: 6px 0 14px; }

  @media print {
    @page { size: A4 portrait; margin: 12mm 14mm; }
    header { padding: 0 0 10px; }
    tr.cli-header { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<header>
  <img src="${logoUrl}" alt="Empac Agroindustrial de Plásticos">
  <div class="info">
    <h1>Relatório de Planilhas de Custo com Prejuízo</h1>
    <p>${periodo} &nbsp;·&nbsp; ${totalSemanas} semana(s) &nbsp;·&nbsp; ${clientes.length} cliente(s) &nbsp;·&nbsp; Emitido em ${emitido}</p>
  </div>
</header>

<table>
  <thead>
    <tr>
      <th>Semana</th>
      <th>Data</th>
      <th>Produto</th>
      <th class="right">Valor</th>
    </tr>
  </thead>
  <tbody>${linhas}</tbody>
  <tfoot>
    <tr>
      <td colspan="3">Total geral</td>
      <td class="right">${fmt(totalGeral)}</td>
    </tr>
  </tfoot>
</table>
</body>
</html>`;

  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.onload = () => w.print();
}

function gerarCsv(
  clientes: ClienteLinha[],
  totalGeral: number,
  ini: number,
  fim: number,
) {
  const cabecalho = ["Cliente", "Semana", "Data", "Produto", "Valor (R$)"].join(";");
  const linhas = clientes.flatMap((c) =>
    c.registros.map((r) =>
      [
        `"${c.clienteNome.replace(/"/g, '""')}"`,
        r.semana,
        r.data,
        `"${r.descricao.replace(/"/g, '""')}"`,
        String(r.valor).replace(".", ","),
      ].join(";"),
    ),
  );
  const rodape = `;;;"Total geral";${String(totalGeral).replace(".", ",")}`;
  const csv = [cabecalho, ...linhas, "", rodape].join("\r\n");

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prejuizos-sem${ini}-${fim || "fim"}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type RegistroLinha = {
  semana: number;
  data: string;
  descricao: string;
  valor: number;
};

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const ini = Number(url.searchParams.get("ini") ?? "1");
  const fim = Number(url.searchParams.get("fim") ?? "0");

  const data = await listarDcp({ ini, fim });

  const mapa = new Map<number, ClienteLinha>();

  for (const s of data.semanas) {
    for (const r of s.registros) {
      const entry = mapa.get(r.clienteId);
      if (entry) {
        entry.guias++;
        entry.total += r.valor;
        entry.registros.push({
          semana: s.semana,
          data: r.data,
          descricao: r.descricao,
          valor: r.valor,
        });
      } else {
        mapa.set(r.clienteId, {
          clienteId: r.clienteId,
          clienteNome: r.clienteNome,
          guias: 1,
          total: r.valor,
          registros: [
            {
              semana: s.semana,
              data: r.data,
              descricao: r.descricao,
              valor: r.valor,
            },
          ],
        });
      }
    }
  }

  const clientes = Array.from(mapa.values()).sort((a, b) => a.total - b.total);

  return {
    clientes,
    totalGeral: data.totalGeral,
    totalSemanas: data.semanas.length,
    ini,
    fim,
  };
}

function SubTabela({ registros }: { registros: RegistroLinha[] }) {
  return (
    <div className="border-t bg-muted/30 px-4 pb-3 pt-2">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-8 text-xs">Sem.</TableHead>
            <TableHead className="h-8 text-xs">Data</TableHead>
            <TableHead className="h-8 text-xs">Produto</TableHead>
            <TableHead className="h-8 text-right text-xs">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registros.map((r, i) => (
            <TableRow key={i} className="hover:bg-transparent">
              <TableCell className="py-1.5 text-sm text-muted-foreground">
                {r.semana}
              </TableCell>
              <TableCell className="py-1.5 text-sm">{r.data}</TableCell>
              <TableCell className="py-1.5 text-sm">{r.descricao}</TableCell>
              <TableCell className="py-1.5 text-right font-mono text-sm tabular-nums text-destructive">
                {brl.format(r.valor)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

const columns: ColumnDef<ClienteLinha>[] = [
  {
    id: "toggle",
    size: 40,
    enableSorting: false,
    enableGlobalFilter: false,
    header: () => null,
    cell: ({ row }) => (
      <button
        type="button"
        onClick={row.getToggleExpandedHandler()}
        className="flex items-center justify-center rounded p-1 text-muted-foreground hover:text-foreground"
        aria-label={row.getIsExpanded() ? "Recolher" : "Expandir"}
      >
        {row.getIsExpanded() ? (
          <ChevronDown className="size-4" />
        ) : (
          <ChevronRight className="size-4" />
        )}
      </button>
    ),
  },
  {
    accessorKey: "clienteNome",
    header: "Cliente",
    cell: ({ row }) => (
      <Link
        to={`/clientes/${row.original.clienteId}`}
        className="font-medium hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {row.original.clienteNome}
      </Link>
    ),
  },
  {
    accessorKey: "guias",
    header: "Guias",
    size: 80,
    meta: { className: "text-center", headerClassName: "text-center" },
  },
  {
    accessorKey: "total",
    header: "Total prejuízo",
    meta: { className: "text-right", headerClassName: "text-right" },
    cell: ({ row }) => (
      <span className="font-mono tabular-nums text-destructive">
        {brl.format(row.original.total)}
      </span>
    ),
  },
];

function renderSubRow(row: Row<ClienteLinha>) {
  return <SubTabela registros={row.original.registros} />;
}

export default function Prejuizos({ loaderData }: Route.ComponentProps) {
  const { clientes, totalGeral, totalSemanas, ini, fim } = loaderData;
  const navigation = useNavigation();
  const carregando = navigation.state === "loading";

  const [busca, setBusca] = React.useState("");
  const clientesFiltrados = busca
    ? clientes.filter((c) =>
        c.clienteNome.toLowerCase().includes(busca.toLowerCase()),
      )
    : clientes;
  const totalFiltrado = clientesFiltrados.reduce((s, c) => s + c.total, 0);

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <TrendingDown className="size-6" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Planilhas de custo
          </h1>
          <p className="text-sm text-muted-foreground">
            Prejuízo acumulado por cliente no período.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtro por semana</CardTitle>
          <CardDescription>
            Deixe "Até" em branco para exibir todas as semanas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="get" className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium" htmlFor="ini">
                De (semana)
              </label>
              <Input
                id="ini"
                name="ini"
                type="number"
                min={1}
                defaultValue={ini}
                className="w-28"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium" htmlFor="fim">
                Até (semana)
              </label>
              <Input
                id="fim"
                name="fim"
                type="number"
                min={0}
                defaultValue={fim || ""}
                placeholder="Todas"
                className="w-28"
              />
            </div>
            <Button type="submit" disabled={carregando}>
              {carregando ? "Buscando..." : "Buscar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={clientesFiltrados.length === 0}
              onClick={() =>
                gerarImpressao(clientesFiltrados, totalFiltrado, ini, fim, totalSemanas)
              }
            >
              <Printer className="mr-2 size-4" />
              Imprimir
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={clientesFiltrados.length === 0}
              onClick={() => gerarCsv(clientesFiltrados, totalFiltrado, ini, fim)}
            >
              <Download className="mr-2 size-4" />
              Exportar CSV
            </Button>
          </Form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de prejuízo</CardDescription>
            <CardTitle className="font-mono text-2xl tabular-nums text-destructive">
              {brl.format(totalGeral)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Semanas</CardDescription>
            <CardTitle className="text-2xl">{totalSemanas}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Clientes</CardDescription>
            <CardTitle className="text-2xl">{clientes.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={clientes}
            searchPlaceholder="Buscar cliente..."
            emptyMessage="Nenhum registro encontrado."
            pageSize={20}
            renderSubRow={renderSubRow}
            onSearchChange={setBusca}
            toolbar={
              <Badge variant="destructive">
                Total: {brl.format(totalGeral)}
              </Badge>
            }
            footer={
              clientes.length > 0 ? (
                <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-2.5 text-sm font-semibold">
                  <span>Total geral</span>
                  <span className="font-mono tabular-nums text-destructive">
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
