import React from "react";
import { Form, Link, redirect, useNavigation } from "react-router";
import { ClipboardList, Loader2, Pencil, Printer } from "lucide-react";
import type { Route } from "./+types/guia-servico.$id";
import { requireUsuario } from "~/lib/auth.server";
import {
  buscarGuiaServico,
  salvarGuiaServico,
  type ComposicaoItem,
} from "~/lib/api";
import {
  MATERIAIS,
  TIPOS_POR_MATERIAL,
  parseDimensoes,
  parseProduto,
  soldaPorTipo,
} from "~/lib/produto";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { Card, CardContent } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ProdutoPicker } from "~/components/produto-picker";

export const handle = { title: "Guia de Serviço" };

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `Guia de Serviço — Encomenda ${params.id} — Empac` }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireUsuario(request);
  const id = Number(params.id);
  if (!id) throw new Response("ID inválido", { status: 400 });
  return buscarGuiaServico(id);
}

export async function action({ request, params }: Route.ActionArgs) {
  await requireUsuario(request);
  const id = Number(params.id);
  if (!id) throw new Response("ID inválido", { status: 400 });

  const fd = await request.formData();
  const get = (k: string) => String(fd.get(k) ?? "");
  const getNum = (k: string) => Number(fd.get(k) ?? 0);

  const resultado = await salvarGuiaServico({
    id,
    dpe: get("dpe"),
    pigId: getNum("pigId"),
    pigPct: getNum("pigPct"),
    poliId: getNum("poliId"),
    poliPct: getNum("poliPct"),
    mistId: getNum("mistId"),
    sanfonaTipo: get("sanfonaTipo") as "L" | "F" | "N",
    sanfonaMm: getNum("sanfonaMm"),
    larguraDupla: get("larguraDupla") === "1",
    cintados: getNum("cintados"),
  });

  if (resultado.erro) {
    return { erro: resultado.erro };
  }

  return redirect(`/guia-servico/${id}`);
}

const kg = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const metros = (v: number) => v.toLocaleString("pt-BR");
const cm = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const esp = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });

function fmtData(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function CabecalhoImpresso({ titulo }: { titulo: string }) {
  return (
    <div className="flex items-center gap-3 border-b pb-3">
      <img
        src="/LogoEmpac1.png"
        alt="Empac Agroindustrial de Plásticos"
        className="h-10 w-auto object-contain"
      />
      <div>
        <p className="text-sm font-semibold">
          Empac Agroindustrial de Plásticos Ltda
        </p>
        <p className="text-xs text-muted-foreground">{titulo}</p>
      </div>
    </div>
  );
}

export default function GuiaServicoPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const nav = useNavigation();
  const salvando = nav.state === "submitting";
  const erro = (actionData as { erro?: string } | undefined)?.erro;

  const { encomendaId, existeGuia, encomenda, guia } = loaderData;
  const [modo, setModo] = React.useState<"editar" | "visualizar">(
    existeGuia ? "visualizar" : "editar",
  );

  // Após gravar com sucesso, volta para o modo de visualização/impressão.
  // (nav.state passa por "submitting" -> "loading" -> "idle" durante o
  // redirect da action; por isso guardamos se já vimos "submitting".)
  const submeteuRef = React.useRef(false);
  React.useEffect(() => {
    if (nav.state === "submitting") submeteuRef.current = true;
    if (nav.state === "idle" && submeteuRef.current) {
      submeteuRef.current = false;
      if (!erro) setModo("visualizar");
    }
  }, [nav.state, erro]);

  const parsed = parseProduto(encomenda.produto);
  const dim = parsed ? parseDimensoes(parsed.dimensoes) : null;
  const tipoNome =
    (parsed &&
      TIPOS_POR_MATERIAL[parsed.material]?.find((t) => t.value === parsed.tipo)
        ?.label) ??
    "—";
  const materialNome =
    MATERIAIS.find((m) => m.value === parsed?.material)?.label ?? "—";
  const solda = parsed ? soldaPorTipo(parsed.tipo) : "SF";
  const pigmentado = parsed?.cor === "P";

  // Reconstrói os percentuais a partir dos pesos gravados (para reedição).
  const pesoTotal =
    (guia?.composicao.polietileno?.pesoKg ?? 0) +
    (guia?.composicao.mistura?.pesoKg ?? 0) +
    (guia?.composicao.pigmento?.pesoKg ?? 0);
  const pctDe = (item: ComposicaoItem) =>
    item && pesoTotal > 0 ? Math.round((item.pesoKg / pesoTotal) * 100) : 0;

  const [pigId, setPigId] = React.useState(
    guia?.composicao.pigmento?.produtoId ?? 0,
  );
  const [pigNome, setPigNome] = React.useState(
    guia?.composicao.pigmento?.produtoNome ?? "",
  );
  const [pigPct, setPigPct] = React.useState(
    String(pctDe(guia?.composicao.pigmento ?? null) || ""),
  );
  const [poliId, setPoliId] = React.useState(
    guia?.composicao.polietileno?.produtoId ?? 0,
  );
  const [poliNome, setPoliNome] = React.useState(
    guia?.composicao.polietileno?.produtoNome ?? "",
  );
  const [poliPct, setPoliPct] = React.useState(
    String(pctDe(guia?.composicao.polietileno ?? null) || ""),
  );
  const [mistId, setMistId] = React.useState(
    guia?.composicao.mistura?.produtoId ?? 0,
  );
  const [mistNome, setMistNome] = React.useState(
    guia?.composicao.mistura?.produtoNome ?? "",
  );
  const [sanfonaTipo, setSanfonaTipo] = React.useState<"L" | "F" | "N">(
    guia?.sanfona.tipo ?? "N",
  );
  const [sanfonaMm, setSanfonaMm] = React.useState(
    String(guia?.sanfona.mm || ""),
  );
  const [larguraDupla, setLarguraDupla] = React.useState(
    guia?.larguraDupla ?? false,
  );
  const [cintados, setCintados] = React.useState(String(guia?.cintados ?? ""));
  const [dpe, setDpe] = React.useState(guia?.dataPrevisaoEntrega ?? "");

  const mistPct = Math.max(
    0,
    100 - (Number(poliPct) || 0) - (pigmentado ? Number(pigPct) || 0 : 0),
  );

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6 print:max-w-none print:space-y-4 print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <ClipboardList className="size-6" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Guia de Serviço{" "}
              <span className="font-mono text-muted-foreground">
                #{String(encomendaId).padStart(4, "0")}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground">
              {encomenda.clienteNome} — {encomenda.produto}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/fila">Voltar</Link>
          </Button>
          {existeGuia && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setModo(modo === "editar" ? "visualizar" : "editar")
              }
            >
              {modo === "editar" ? (
                "Visualizar guia"
              ) : (
                <>
                  <Pencil className="size-3.5" />
                  Editar
                </>
              )}
            </Button>
          )}
          {modo === "visualizar" && (
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="size-3.5" />
              Imprimir
            </Button>
          )}
        </div>
      </div>

      {modo === "editar" ? (
        <Form method="post" className="space-y-6 print:hidden">
          <input type="hidden" name="pigId" value={pigId} />
          <input type="hidden" name="poliId" value={poliId} />
          <input type="hidden" name="mistId" value={mistId} />

          {erro && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {erro}
            </div>
          )}

          <Card>
            <CardContent className="pt-6">
              <p className="mb-4 text-sm font-medium text-muted-foreground">
                Dados da Encomenda
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <p className="font-medium">{tipoNome}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Material</p>
                  <p className="font-medium">{materialNome}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dimensões</p>
                  <p className="font-mono font-medium">
                    {dim
                      ? `${cm(dim.larCm)} x ${cm(dim.comCm)} x ${esp(dim.espCm)}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quantidade</p>
                  <p className="font-medium">
                    {encomenda.qtdPedida.toLocaleString("pt-BR")}{" "}
                    {encomenda.unidade}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="dpe">
                  Previsão de Entrega <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dpe"
                  name="dpe"
                  type="date"
                  required
                  value={dpe}
                  onChange={(e) => setDpe(e.target.value)}
                  className="mt-1 max-w-xs"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="mb-4 text-sm font-medium text-muted-foreground">
                Composição / Matéria-Prima
              </p>
              <div className="space-y-4">
                {pigmentado && (
                  <div>
                    <Label>Pigmento / Cor</Label>
                    <div className="mt-1 flex items-center gap-3">
                      <div className="flex-1">
                        <ProdutoPicker
                          produtoId={pigId}
                          produtoNome={pigNome}
                          onChange={(id, nome) => {
                            setPigId(id);
                            setPigNome(nome);
                          }}
                        />
                      </div>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={pigPct}
                        onChange={(e) => setPigPct(e.target.value)}
                        className="w-24"
                        placeholder="%"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label>
                    Polietileno Base <span className="text-destructive">*</span>
                  </Label>
                  <div className="mt-1 flex items-center gap-3">
                    <div className="flex-1">
                      <ProdutoPicker
                        produtoId={poliId}
                        produtoNome={poliNome}
                        onChange={(id, nome) => {
                          setPoliId(id);
                          setPoliNome(nome);
                        }}
                      />
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={poliPct}
                      onChange={(e) => setPoliPct(e.target.value)}
                      className="w-24"
                      placeholder="%"
                    />
                  </div>
                </div>

                <div>
                  <Label>
                    Mistura <span className="text-destructive">*</span>
                  </Label>
                  <div className="mt-1 flex items-center gap-3">
                    <div className="flex-1">
                      <ProdutoPicker
                        produtoId={mistId}
                        produtoNome={mistNome}
                        onChange={(id, nome) => {
                          setMistId(id);
                          setMistNome(nome);
                        }}
                      />
                    </div>
                    <div className="flex w-24 items-center justify-center rounded-md border bg-muted px-2 py-1.5 text-sm tabular-nums">
                      {mistPct}%
                    </div>
                    <input type="hidden" name="poliPct" value={poliPct || 0} />
                    <input
                      type="hidden"
                      name="pigPct"
                      value={pigmentado ? pigPct || 0 : 0}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Calculado automaticamente: 100% − Polietileno − Pigmento.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="mb-4 text-sm font-medium text-muted-foreground">
                Sanfona, Extrusão e Acabamento
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="sanfonaTipo">Sanfona</Label>
                  <Select
                    name="sanfonaTipo"
                    value={sanfonaTipo}
                    onValueChange={(v) => setSanfonaTipo(v as "L" | "F" | "N")}
                  >
                    <SelectTrigger id="sanfonaTipo" className="mt-1 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N">Nenhuma</SelectItem>
                      <SelectItem value="L">Lateral</SelectItem>
                      <SelectItem value="F">Fundo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {sanfonaTipo !== "N" && (
                  <div>
                    <Label htmlFor="sanfonaMm">Sanfona (mm)</Label>
                    <Input
                      id="sanfonaMm"
                      name="sanfonaMm"
                      type="number"
                      min={0}
                      value={sanfonaMm}
                      onChange={(e) => setSanfonaMm(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="cintados">
                    Cintados <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cintados"
                    name="cintados"
                    type="number"
                    min={0}
                    required
                    value={cintados}
                    onChange={(e) => setCintados(e.target.value)}
                    className="mt-1"
                  />
                </div>

                {solda === "SL" && (
                  <div className="flex items-center gap-2 pt-6">
                    <Checkbox
                      id="larguraDupla"
                      checked={larguraDupla}
                      onCheckedChange={(v) => setLarguraDupla(v === true)}
                    />
                    <input
                      type="hidden"
                      name="larguraDupla"
                      value={larguraDupla ? "1" : "0"}
                    />
                    <Label htmlFor="larguraDupla" className="font-normal">
                      Extrusar em largura dupla?
                    </Label>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button asChild variant="outline">
              <Link to="/fila">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando && <Loader2 className="mr-2 size-4 animate-spin" />}
              Gravar Guia de Serviço
            </Button>
          </div>
        </Form>
      ) : (
        guia && (
          <div className="space-y-8 print:space-y-0">
            <GuiaUniex
              encomendaId={encomendaId}
              encomenda={encomenda}
              guia={guia}
              tipoNome={tipoNome}
              materialNome={materialNome}
              dim={dim}
            />
            <GuiaUnicort
              encomendaId={encomendaId}
              encomenda={encomenda}
              guia={guia}
              tipoNome={tipoNome}
              materialNome={materialNome}
              solda={solda}
              pigmentado={pigmentado}
            />
            <GuiaUnipac
              encomendaId={encomendaId}
              encomenda={encomenda}
              guia={guia}
              tipoNome={tipoNome}
            />
            <RequisicaoUnimat
              encomendaId={encomendaId}
              encomenda={encomenda}
              guia={guia}
            />
          </div>
        )
      )}
    </main>
  );
}

type SecaoProps = {
  encomendaId: number;
  encomenda: Route.ComponentProps["loaderData"]["encomenda"];
  guia: NonNullable<Route.ComponentProps["loaderData"]["guia"]>;
};

function GuiaUniex({
  encomendaId,
  encomenda,
  guia,
  tipoNome,
  materialNome,
  dim,
}: SecaoProps & {
  tipoNome: string;
  materialNome: string;
  dim: { larCm: number; comCm: number; espCm: number } | null;
}) {
  return (
    <Card className="print:break-after-page print:rounded-none print:border-0 print:shadow-none">
      <CardContent className="space-y-3 pt-6 font-mono text-sm print:pt-0">
        <CabecalhoImpresso titulo="Guia de Serviço UNIEX (Extrusão) — 1ª Via" />
        <div className="flex justify-between gap-4">
          <span>Data Pedido: {fmtData(encomenda.dataPedido)}</span>
          <span>Encomenda de: {encomenda.clienteNome}</span>
          <span>Cód.: {encomenda.clienteId}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>
            Guia n. {String(encomendaId).padStart(5, "0")} —{" "}
            {encomenda.qtdPedida.toLocaleString("pt-BR")} {encomenda.unidade}{" "}
            {encomenda.produto}
          </span>
        </div>
        <p>
          Extrusora de {materialNome} — {tipoNome}
        </p>
        <div className="border-t pt-2">
          {guia.composicao.polietileno && (
            <div className="flex justify-between gap-4">
              <span>
                P{guia.composicao.polietileno.produtoId} -{" "}
                {guia.composicao.polietileno.produtoNome}
              </span>
              <span>{kg(guia.composicao.polietileno.pesoKg)} kg</span>
            </div>
          )}
          {guia.composicao.mistura && (
            <div className="flex justify-between gap-4">
              <span>
                P{guia.composicao.mistura.produtoId} -{" "}
                {guia.composicao.mistura.produtoNome}
              </span>
              <span>{kg(guia.composicao.mistura.pesoKg)} kg</span>
            </div>
          )}
          {guia.composicao.pigmento && (
            <div className="flex justify-between gap-4">
              <span>
                P{guia.composicao.pigmento.produtoId} -{" "}
                {guia.composicao.pigmento.produtoNome}
              </span>
              <span>{kg(guia.composicao.pigmento.pesoKg)} kg</span>
            </div>
          )}
        </div>
        <div className="flex justify-between gap-4 border-t pt-2">
          <span>Produzir {metros(guia.metrosExtrudar)} metros</span>
          <span>
            Peso (Kg) total:{" "}
            {kg(
              (guia.composicao.polietileno?.pesoKg ?? 0) +
                (guia.composicao.mistura?.pesoKg ?? 0) +
                (guia.composicao.pigmento?.pesoKg ?? 0),
            )}
          </span>
        </div>
        <p>
          Extrusar na largura de: {cm(guia.larguraExtrusaoCm)} cm — Espessura:{" "}
          {dim ? esp(dim.espCm) : "—"} cm
        </p>
        <p>
          Confira: 1 metro deste filme deve pesar {guia.pesoMetroGramas} gramas
        </p>
        <p>
          {guia.sanfona.tipo === "N"
            ? "Sem sanfona na extrusão"
            : `Sanfona ${guia.sanfona.tipo === "L" ? "lateral" : "de fundo"}: ${guia.sanfona.mm} mm`}
        </p>
      </CardContent>
    </Card>
  );
}

function GuiaUnicort({
  encomendaId,
  encomenda,
  guia,
  tipoNome,
  materialNome,
  solda,
  pigmentado,
}: SecaoProps & {
  tipoNome: string;
  materialNome: string;
  solda: "SL" | "SF";
  pigmentado: boolean;
}) {
  return (
    <Card className="print:break-after-page print:rounded-none print:border-0 print:shadow-none">
      <CardContent className="space-y-3 pt-6 font-mono text-sm print:pt-0">
        <CabecalhoImpresso titulo="Guia de Serviço UNICORT (Corte/Solda) — 1ª Via" />
        <div className="flex justify-between gap-4">
          <span>Data Pedido: {fmtData(encomenda.dataPedido)}</span>
          <span>Encomenda de: {encomenda.clienteNome}</span>
          <span>Cód.: {encomenda.clienteId}</span>
        </div>
        <div>
          Guia n. {String(encomendaId).padStart(5, "0")} —{" "}
          {encomenda.qtdPedida.toLocaleString("pt-BR")} {encomenda.unidade} —{" "}
          {tipoNome}
        </div>
        <p>{encomenda.produto}</p>
        <p>
          Bobinas: {materialNome}
          {pigmentado && guia.composicao.pigmento
            ? ` / Cor: ${guia.composicao.pigmento.produtoNome}`
            : ""}
        </p>
        <p>
          Use máquina: CS ______ com solda{" "}
          {solda === "SL" ? "lateral" : "de fundo"}
        </p>
        <div className="flex justify-between gap-4 border-t pt-2">
          <span>Cintar com: {guia.cintados}</span>
          <span>Empacotar de: {guia.pacotes} unidades</span>
        </div>
      </CardContent>
    </Card>
  );
}

function GuiaUnipac({
  encomendaId,
  encomenda,
  guia,
  tipoNome,
}: SecaoProps & { tipoNome: string }) {
  return (
    <Card className="print:break-after-page print:rounded-none print:border-0 print:shadow-none">
      <CardContent className="space-y-3 pt-6 font-mono text-sm print:pt-0">
        <CabecalhoImpresso titulo="Guia de Serviço UNIPAC (Embalagem) — Via Extra" />
        <div className="flex justify-between gap-4">
          <span>Data Pedido: {fmtData(encomenda.dataPedido)}</span>
          <span>Encomenda de: {encomenda.clienteNome}</span>
          <span>Cód.: {encomenda.clienteId}</span>
        </div>
        <div>
          Guia n. {String(encomendaId).padStart(5, "0")} —{" "}
          {encomenda.qtdPedida.toLocaleString("pt-BR")} {encomenda.unidade} —{" "}
          {tipoNome}
        </div>
        <p>{encomenda.produto}</p>
        <div className="flex justify-between gap-4 border-t pt-2">
          <span>Cintar com: {guia.cintados}</span>
          <span>Empacotar de: {guia.pacotes} unidades</span>
        </div>
        <p className="text-muted-foreground print:text-black">
          Observações: ______________________________________________
        </p>
      </CardContent>
    </Card>
  );
}

function RequisicaoUnimat({ encomendaId, encomenda, guia }: SecaoProps) {
  const itens = [
    guia.composicao.polietileno,
    guia.composicao.mistura,
    guia.composicao.pigmento,
  ].filter((i): i is NonNullable<typeof i> => i !== null);

  return (
    <Card className="print:rounded-none print:border-0 print:shadow-none">
      <CardContent className="space-y-3 pt-6 font-mono text-sm print:pt-0">
        <CabecalhoImpresso titulo="Requisição à UNIMAT" />
        <div className="flex justify-between gap-4">
          <span>Data Pedido: {fmtData(encomenda.dataPedido)}</span>
          <span>Encomenda de: {encomenda.clienteNome}</span>
          <span>Cód.: {encomenda.clienteId}</span>
        </div>
        <div>
          Guia n. {String(encomendaId).padStart(5, "0")} — Requisição n.
          (atribuída na impressão física)
        </div>
        <table className="w-full border-t text-left">
          <thead>
            <tr className="text-xs text-muted-foreground print:text-black">
              <th className="pt-2 font-normal">Local</th>
              <th className="pt-2 font-normal">Código</th>
              <th className="pt-2 font-normal">Descrição</th>
              <th className="pt-2 text-right font-normal">Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <tr key={item.produtoId}>
                <td className="py-0.5">{item.localizacao}</td>
                <td className="py-0.5">P{item.produtoId}</td>
                <td className="py-0.5">{item.produtoNome}</td>
                <td className="py-0.5 text-right">{kg(item.pesoKg)} kg</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
