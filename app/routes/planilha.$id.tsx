import { useNavigate } from "react-router";
import { ArrowLeft, FileSpreadsheet, Printer } from "lucide-react";
import type { Route } from "./+types/planilha.$id";
import { obterPlanilha, type MovimentoPlanilha } from "~/lib/api";
import { requireUsuario } from "~/lib/auth.server";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { cn } from "~/lib/utils";

export const handle = { title: "Planilha de Custo" };

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    {
      title: loaderData
        ? `Planilha de Custo — Encomenda ${loaderData.id} — Empac`
        : "Planilha de Custo — Empac",
    },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  await requireUsuario(request);
  return obterPlanilha(Number(params.id));
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const qty = (v: number, dec: number) =>
  (v / 10 ** dec).toLocaleString("pt-BR", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
const centavos = (v: number) => brl.format(v / 100);

const TIPO_MOV: Record<number, string> = {
  1: "Entrada",
  2: "Saída",
  3: "Transferência",
  4: "Devolução/Apara",
  5: "Ajuste",
  6: "Cancelamento",
};

function fmtData(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function LinhaResumo({
  label,
  valor,
  sub,
  destaque,
}: {
  label: string;
  valor: string;
  sub?: string;
  destaque?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between py-1.5">
      <span className={cn("text-sm", destaque && "font-medium")}>
        {label}
        {sub ? <span className="ml-1.5 text-xs text-muted-foreground">{sub}</span> : null}
      </span>
      <span className={cn("font-mono text-sm tabular-nums", destaque && "font-semibold")}>
        {valor}
      </span>
    </div>
  );
}

export default function PlanilhaCustoPage({ loaderData }: Route.ComponentProps) {
  const p = loaderData;
  const r = p.resumo;
  const prejuizo = r.resultado < 0;
  const navigate = useNavigate();

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6 print:max-w-none print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
          Voltar
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{p.estadoNome}</Badge>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-3.5" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Cabeçalho de impressão — só aparece no PDF/impresso */}
      <div className="hidden items-center gap-3 border-b pb-4 print:flex">
        <img src="/LogoEmpac1.png" alt="Empac Agroindustrial de Plásticos" className="h-14 w-auto object-contain" />
        <div>
          <p className="font-semibold">Empac Agroindustrial de Plásticos Ltda</p>
          <p className="text-sm text-muted-foreground">
            Planilha de Custo de Encomendado — Encomenda E{p.id}
          </p>
        </div>
      </div>

      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="size-5 text-muted-foreground" />
              <div>
                <CardTitle>Planilha de Custo de Encomendado</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Encomenda E{p.id} · Pedido em {fmtData(p.dataPedido)}
                </p>
              </div>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>Semana {p.semana}</p>
              <p>Fator {p.fator.toLocaleString("pt-BR")}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Encomendado</p>
            <p className="text-sm font-medium">{p.produto}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cliente</p>
            <p className="text-sm font-medium">
              {p.clienteId}-{p.clienteNome}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Qtd. pedida / produzida</p>
            <p className="font-mono text-sm tabular-nums">
              {qty(p.qtdPedida, 3)} / {qty(p.qtdProduzida, 3)} {p.unidade}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Peso total</p>
            <p className="font-mono text-sm tabular-nums">{qty(r.pesoTotal, 3)} Kg</p>
          </div>
        </CardContent>
      </Card>

      {/* Movimentos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Materiais e Mão de Obra</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-y bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Data</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Requis./Reg.</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Quant.</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Un.</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Cód.</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Descrição</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Tipo</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {p.movimentos.map((m: MovimentoPlanilha) => (
                <tr key={m.seq} className="hover:bg-muted/30">
                  <td className="px-4 py-1.5 tabular-nums text-muted-foreground">{fmtData(m.data)}</td>
                  <td className="px-4 py-1.5 tabular-nums text-muted-foreground">{m.reg}</td>
                  <td className="px-4 py-1.5 text-right font-mono tabular-nums">
                    {qty(m.qtdRaw, m.qtdDec)}
                  </td>
                  <td className="px-4 py-1.5 text-muted-foreground">{m.unidade}</td>
                  <td className="px-4 py-1.5 font-mono text-xs text-muted-foreground">{m.produtoCod}</td>
                  <td className="px-4 py-1.5">{m.produtoNome}</td>
                  <td className="px-4 py-1.5 text-xs text-muted-foreground">{TIPO_MOV[m.tipo] ?? `Tipo ${m.tipo}`}</td>
                  <td
                    className={cn(
                      "px-4 py-1.5 text-right font-mono tabular-nums",
                      m.valorCentavos < 0 && "text-red-600",
                    )}
                  >
                    {centavos(m.valorCentavos)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Resumo financeiro */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Composição de Custos</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <LinhaResumo label="Materiais e Mão de Obra" valor={centavos(r.direto)} />
            <LinhaResumo label="Custos Indiretos (Adm)" sub="11%" valor={centavos(r.indireto)} />
            <LinhaResumo
              label="Custo de Vendas"
              sub={`${r.custoVendasPct}%`}
              valor={centavos(r.custoVendas)}
            />
            <LinhaResumo
              label="Custo Financeiro"
              sub={`${r.cFinanceiroDias} dias`}
              valor={centavos(r.cFinanceiro)}
            />
            <LinhaResumo label="Subtotal" valor={centavos(r.subtotal)} destaque />
            <LinhaResumo label="ICMS" sub={`${r.icmsPct}%`} valor={centavos(r.icms)} />
            <LinhaResumo label="IR/PIS/Cofins/C.Soc" sub="5,94%" valor={centavos(r.irPisCofins)} />
            <LinhaResumo label="Total" valor={centavos(r.total)} destaque />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resultado</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <LinhaResumo label="Preço Vendido (unit.)" valor={centavos(p.precoVenda)} />
            <LinhaResumo label="Valor a Faturar" valor={centavos(r.vendasTotal)} />
            <LinhaResumo label="Pós-Cálculo (unit.)" valor={centavos(r.posCalc)} />
            <LinhaResumo
              label="Pós-Cálculo (fator base)"
              sub="por kg"
              valor={centavos(r.posCalcFator)}
            />
            <div className="pt-3">
              <p
                className={cn(
                  "text-sm font-medium",
                  prejuizo ? "text-red-600" : "text-emerald-600",
                )}
              >
                Apurado: {prejuizo ? "Prejuízo" : "Lucro"} de {centavos(Math.abs(r.resultado))}
              </p>
              {prejuizo && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Para lucro zero: {centavos(r.paraLucro)}/Kg
                </p>
              )}
            </div>
            <div className="pt-3 text-xs text-muted-foreground">
              <p>
                Origem: {p.origem} · Classif. Fiscal: {p.classifFiscal} · Tributado IPI:{" "}
                {p.ipi === "S" ? "Sim" : "Não"}
              </p>
              <p>
                Observe: {r.kgDif > 0 ? "Faltou" : r.kgDif < 0 ? "Excedeu" : "Exatidão"}{" "}
                {qty(Math.abs(r.kgDif), 3)} Kg
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
