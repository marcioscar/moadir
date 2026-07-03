import React from "react";
import { Form, Link, useNavigation } from "react-router";
import { ArrowLeft, Loader2, PackagePlus } from "lucide-react";
import type { Route } from "./+types/encomendas.$id.consumo";
import { requireUsuario } from "~/lib/auth.server";
import {
  buscarDetalheEncomenda,
  lancarConsumo,
  type MovimentoGSF,
} from "~/lib/api";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ProdutoPicker } from "~/components/produto-picker";
import { fmtData, TIPO_MOV } from "~/lib/formato";

export const handle = { title: "Lançar Consumo" };

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `Lançar Consumo — Encomenda ${params.id} — Empac` }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireUsuario(request);
  const id = Number(params.id);
  if (!id) throw new Response("ID inválido", { status: 400 });
  return buscarDetalheEncomenda(id);
}

export async function action({ request, params }: Route.ActionArgs) {
  await requireUsuario(request);
  const id = Number(params.id);
  if (!id) throw new Response("ID inválido", { status: 400 });

  const fd = await request.formData();
  const produtoId = Number(fd.get("produtoId") ?? 0);
  const tipo = Number(fd.get("tipo") ?? 0);
  const quantidade = Number(fd.get("quantidade") ?? 0);
  const reg = Number(fd.get("reg") ?? 0);
  const data = String(fd.get("data") ?? "");

  if (!produtoId) return { erro: "Selecione um material ou hora-máquina" };
  if (tipo !== 2 && tipo !== 4) return { erro: "Tipo inválido" };
  if (!quantidade || quantidade <= 0) return { erro: "Informe uma quantidade válida" };

  const resultado = await lancarConsumo({
    id,
    produtoId,
    tipo,
    quantidade,
    reg: reg || undefined,
    data: data || undefined,
  });

  if (resultado.erro) return { erro: resultado.erro };
  return { ok: true };
}

export default function ConsumoPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const enc = loaderData;
  const nav = useNavigation();
  const lancando = nav.state === "submitting";
  const erro = (actionData as { erro?: string } | undefined)?.erro;
  const ok = (actionData as { ok?: boolean } | undefined)?.ok;

  const [produtoId, setProdutoId] = React.useState(0);
  const [produtoNome, setProdutoNome] = React.useState("");
  const [tipo, setTipo] = React.useState<"2" | "4">("2");
  const [quantidade, setQuantidade] = React.useState("");
  const [reg, setReg] = React.useState("");
  const [data, setData] = React.useState(
    () => new Date().toISOString().slice(0, 10),
  );

  // Limpa o formulário depois de um lançamento bem-sucedido.
  const okRef = React.useRef(false);
  React.useEffect(() => {
    if (nav.state === "submitting") okRef.current = true;
    if (nav.state === "idle" && okRef.current) {
      okRef.current = false;
      if (ok) {
        setProdutoId(0);
        setProdutoNome("");
        setQuantidade("");
        setReg("");
      }
    }
  }, [nav.state, ok]);

  const fechada = enc.estado > 5;

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PackagePlus className="size-6" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Lançar Consumo{" "}
              <span className="font-mono text-muted-foreground">
                E{String(enc.id).padStart(4, "0")}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground">
              {enc.clienteNome} — {enc.produto}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{enc.estadoNome}</Badge>
          <Button asChild variant="ghost" size="sm">
            <Link to={`/planilha/${enc.id}`}>
              <ArrowLeft className="size-4" />
              Planilha de Custo
            </Link>
          </Button>
        </div>
      </div>

      {fechada && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Esta encomenda já está com estado "{enc.estadoNome}" e não aceita
          novos lançamentos de consumo.
        </div>
      )}

      {erro && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {erro}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Novo Lançamento</CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            <input type="hidden" name="produtoId" value={produtoId} />
            <div>
              <Label>Material ou Hora-Máquina</Label>
              <div className="mt-1">
                <ProdutoPicker
                  produtoId={produtoId}
                  produtoNome={produtoNome}
                  placeholder="Buscar material ou hora-máquina"
                  onChange={(id, nome) => {
                    setProdutoId(id);
                    setProdutoNome(nome);
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  name="tipo"
                  value={tipo}
                  onValueChange={(v) => setTipo(v as "2" | "4")}
                >
                  <SelectTrigger id="tipo" className="mt-1 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">Consumo</SelectItem>
                    <SelectItem value="4">Devolução/Apara</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantidade">Quantidade</Label>
                <Input
                  id="quantidade"
                  name="quantidade"
                  type="number"
                  min={0}
                  step="0.001"
                  required
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="reg">Reg. (opcional)</Label>
                <Input
                  id="reg"
                  name="reg"
                  type="number"
                  min={0}
                  value={reg}
                  onChange={(e) => setReg(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="data">Data</Label>
                <Input
                  id="data"
                  name="data"
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={fechada || lancando}>
                {lancando && <Loader2 className="mr-2 size-4 animate-spin" />}
                Lançar
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Movimentos Lançados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-y bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Data</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Tipo</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Item</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Quant.</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Un.</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Reg.</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {enc.movimentos.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    Nenhum consumo lançado ainda.
                  </td>
                </tr>
              )}
              {enc.movimentos.map((m: MovimentoGSF) => (
                <tr key={m.seq} className="hover:bg-muted/30">
                  <td className="px-4 py-1.5 tabular-nums text-muted-foreground">{fmtData(m.data)}</td>
                  <td className="px-4 py-1.5 text-xs text-muted-foreground">{TIPO_MOV[m.tipo] ?? `Tipo ${m.tipo}`}</td>
                  <td className="px-4 py-1.5">{m.produtoNome}</td>
                  <td className="px-4 py-1.5 text-right font-mono tabular-nums">{m.quantidade}</td>
                  <td className="px-4 py-1.5 text-muted-foreground">{m.unidade}</td>
                  <td className="px-4 py-1.5 text-right tabular-nums text-muted-foreground">
                    {m.requisicao || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  );
}
