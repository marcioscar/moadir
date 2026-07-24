import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import type { Route } from "./+types/orcamento";
import {
  calcularOrcamento,
  type OrcamentoItemInput,
  type OrcamentoResposta,
} from "~/lib/api";
import { requireUsuario } from "~/lib/auth.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ProdutoPicker } from "~/components/produto-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { CalculatorIcon, PlusIcon, XIcon } from "lucide-react";

export const handle = { title: "Orçamento" };

export function meta({}: Route.MetaArgs) {
  return [{ title: "Orçamento — Empac" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUsuario(request);
  return null;
}

const MAX_ITENS = 4;

export async function action({ request }: Route.ActionArgs) {
  await requireUsuario(request);
  const form = await request.formData();
  const count = Math.min(Number(form.get("count") ?? 0), MAX_ITENS);

  const num = (n: string) => Number(String(form.get(n) ?? "").replace(",", "."));
  const str = (n: string) => String(form.get(n) ?? "").trim().toUpperCase();

  const itens: OrcamentoItemInput[] = [];
  for (let i = 0; i < count; i++) {
    const cod = str(`cod${i}`);
    if (!cod) continue;
    itens.push({
      qtd: num(`qtd${i}`),
      cod,
      l: num(`l${i}`),
      c: num(`c${i}`),
      e: num(`e${i}`),
      pigId: num(`pig${i}`) || undefined,
      tintaId: num(`tinta${i}`) || undefined,
    });
  }

  if (itens.length === 0) {
    return { ok: false as const, erro: "Informe o código de ao menos um item." };
  }

  try {
    const resposta = await calcularOrcamento(itens);
    if (resposta.status !== "sucesso") {
      return { ok: false as const, erro: "Não foi possível calcular o orçamento." };
    }
    return { ok: true as const, resposta };
  } catch {
    return { ok: false as const, erro: "Erro ao calcular orçamento." };
  }
}

type Cor = { id: number; nome: string };
const corVazia: Cor = { id: 0, nome: "" };

type ItemForm = {
  key: number;
  cod: string;
  qtd: string;
  l: string;
  c: string;
  e: string;
  pig: Cor;
  tinta: Cor;
};

type OrcamentoCalculado = { id: number; resposta: OrcamentoResposta };

export default function Orcamento() {
  const fetcher = useFetcher<typeof action>();
  const proximaChave = useRef(1);
  const proximoHistId = useRef(1);

  function criarItem(): ItemForm {
    return {
      key: proximaChave.current++,
      cod: "",
      qtd: "",
      l: "",
      c: "",
      e: "",
      pig: corVazia,
      tinta: corVazia,
    };
  }

  const [itens, setItens] = useState<ItemForm[]>(() => [criarItem()]);
  const [historico, setHistorico] = useState<OrcamentoCalculado[]>([]);

  useEffect(() => {
    const dados = fetcher.data;
    if (dados?.ok) {
      const resposta = dados.resposta;
      setHistorico((h) => [{ id: proximoHistId.current++, resposta }, ...h]);
      setItens([criarItem()]);
    }
  }, [fetcher.data]);

  function atualizarItem(key: number, patch: Partial<ItemForm>) {
    setItens((its) => its.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }

  function adicionarItem() {
    setItens((its) => (its.length >= MAX_ITENS ? its : [...its, criarItem()]));
  }

  function removerItem(key: number) {
    setItens((its) => (its.length <= 1 ? its : its.filter((it) => it.key !== key)));
  }

  const calculando = fetcher.state !== "idle";

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="flex items-center gap-2">
        <CalculatorIcon className="size-5 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Orçamento de Sacos</h1>
      </div>

      <div className="rounded-lg border p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-medium">Itens</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={adicionarItem}
            disabled={itens.length >= MAX_ITENS}
          >
            <PlusIcon className="size-3.5" />
            Adicionar Item
          </Button>
        </div>

        <fetcher.Form method="post" className="space-y-6">
          <input type="hidden" name="count" value={itens.length} />
          {itens.map((item, i) => (
            <div key={item.key} className="space-y-3 border-b pb-4 last:border-b-0 last:pb-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Item {i + 1}
                </span>
                {itens.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => removerItem(item.key)}
                  >
                    <XIcon className="size-3.5" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-5 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor={`cod${i}`}>Código</Label>
                  <Input
                    id={`cod${i}`}
                    name={`cod${i}`}
                    className="font-mono uppercase"
                    placeholder="SBNI5"
                    value={item.cod}
                    onChange={(e) =>
                      atualizarItem(item.key, { cod: e.target.value.toUpperCase() })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`qtd${i}`}>Qtd (kg)</Label>
                  <Input
                    id={`qtd${i}`}
                    name={`qtd${i}`}
                    type="number"
                    step="any"
                    placeholder="150"
                    value={item.qtd}
                    onChange={(e) => atualizarItem(item.key, { qtd: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`l${i}`}>Largura</Label>
                  <Input
                    id={`l${i}`}
                    name={`l${i}`}
                    type="number"
                    step="any"
                    placeholder="30"
                    value={item.l}
                    onChange={(e) => atualizarItem(item.key, { l: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`c${i}`}>Comprimento</Label>
                  <Input
                    id={`c${i}`}
                    name={`c${i}`}
                    type="number"
                    step="any"
                    placeholder="40"
                    value={item.c}
                    onChange={(e) => atualizarItem(item.key, { c: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`e${i}`}>Espessura</Label>
                  <Input
                    id={`e${i}`}
                    name={`e${i}`}
                    type="number"
                    step="any"
                    placeholder="0.006"
                    value={item.e}
                    onChange={(e) => atualizarItem(item.key, { e: e.target.value })}
                  />
                </div>
              </div>

              {item.cod.includes("P") && (
                <div className="space-y-1.5">
                  <Label>Pigmento</Label>
                  <ProdutoPicker
                    produtoId={item.pig.id}
                    produtoNome={item.pig.nome}
                    placeholder="Nenhum pigmento selecionado"
                    onChange={(id, nome) => atualizarItem(item.key, { pig: { id, nome } })}
                  />
                  <input type="hidden" name={`pig${i}`} value={item.pig.id || ""} />
                </div>
              )}

              {item.cod.includes("I") && (
                <div className="space-y-1.5">
                  <Label>Tinta</Label>
                  <ProdutoPicker
                    produtoId={item.tinta.id}
                    produtoNome={item.tinta.nome}
                    placeholder="Nenhuma tinta selecionada"
                    onChange={(id, nome) => atualizarItem(item.key, { tinta: { id, nome } })}
                  />
                  <input type="hidden" name={`tinta${i}`} value={item.tinta.id || ""} />
                </div>
              )}
            </div>
          ))}
          <Button type="submit" disabled={calculando}>
            {calculando ? "Calculando..." : "Calcular Orçamento"}
          </Button>
        </fetcher.Form>
      </div>

      {fetcher.data?.ok === false && (
        <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {fetcher.data.erro}
        </p>
      )}

      {historico.map((h) => (
        <div key={h.id} className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Dimensões</TableHead>
                <TableHead className="text-right">Qtd (kg)</TableHead>
                <TableHead className="text-right">Preço/kg</TableHead>
                <TableHead className="text-right">Valor do Item</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {h.resposta.itens.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum item cotado — confira os códigos informados.
                  </TableCell>
                </TableRow>
              )}
              {h.resposta.itens.map((it) => (
                <TableRow key={it.item}>
                  <TableCell>{it.item}</TableCell>
                  <TableCell className="font-mono">{it.codigo}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {it.dimensoes}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{it.qtd_kg}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    R$ {it.preco_kg}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums font-medium">
                    R$ {it.valor_item}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </main>
  );
}
