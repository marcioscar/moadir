import React from "react";
import { useFetcher } from "react-router";
import { Settings2 } from "lucide-react";
import type { Route } from "./+types/atualizacao";
import { listarEncomendas, type Encomenda } from "~/lib/api";
import { requireUsuario } from "~/lib/auth.server";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";

export const handle = { title: "Atualização de Produção" };

export function meta({}: Route.MetaArgs) {
  return [{ title: "Atualização de Produção — Empac" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUsuario(request);
  return listarEncomendas({ abertos: true });
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

const qty = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });

function EstadoSelect({ encomenda }: { encomenda: Encomenda }) {
  const fetcher = useFetcher<{ ok: boolean; erro?: string }>();

  const estadoAtual =
    fetcher.formData != null
      ? Number(fetcher.formData.get("estado"))
      : encomenda.estado;

  const enviando = fetcher.state !== "idle";
  const erro = fetcher.data && "erro" in fetcher.data;

  return (
    <fetcher.Form method="post" action="/api/encomenda-estado">
      <input type="hidden" name="id" value={encomenda.id} />
      <Select
        value={String(estadoAtual)}
        disabled={enviando}
        onValueChange={(v) => {
          fetcher.submit(
            { id: String(encomenda.id), estado: v },
            { method: "post", action: "/api/encomenda-estado" },
          );
        }}
      >
        <SelectTrigger
          className={cn(
            "h-8 w-40 text-xs",
            enviando && "opacity-60",
            erro && "border-red-400",
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(ESTAGIOS).map(([k, v]) => (
            <SelectItem key={k} value={k} className="text-xs">
              <span className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "inline-block h-2 w-2 rounded-full border",
                    v.className,
                  )}
                />
                {v.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </fetcher.Form>
  );
}

export default function Atualizacao({ loaderData }: Route.ComponentProps) {
  const { encomendas, total } = loaderData;

  const [filtro, setFiltro] = React.useState<string>("todos");

  const dados =
    filtro === "todos"
      ? encomendas
      : encomendas.filter((e) => String(e.estado) === filtro);

  const contsPorEstagio = React.useMemo(() => {
    const map: Record<number, number> = {};
    for (const e of encomendas) map[e.estado] = (map[e.estado] ?? 0) + 1;
    return map;
  }, [encomendas]);

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Settings2 className="size-6" />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Atualização de Produção
          </h1>
          <p className="text-sm text-muted-foreground">
            Mova encomendas entre os estágios do pipeline.
          </p>
        </div>
        <Badge variant="secondary">{total} em aberto</Badge>
      </div>

      {/* Filtro por estágio */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFiltro("todos")}
          className={cn(
            "rounded-full border px-3 py-1 text-xs transition-colors",
            filtro === "todos"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background hover:bg-muted",
          )}
        >
          Todos ({total})
        </button>
        {Object.entries(contsPorEstagio)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([est, cnt]) => (
            <button
              key={est}
              type="button"
              onClick={() => setFiltro((v) => (v === est ? "todos" : est))}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                filtro === est
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted",
              )}
            >
              {ESTAGIOS[Number(est)]?.label} ({cnt})
            </button>
          ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-hidden rounded-lg">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nº</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Produto</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Qtd</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estágio</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {dados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-muted-foreground">
                      Nenhuma encomenda encontrada.
                    </td>
                  </tr>
                ) : (
                  dados.map((enc) => (
                    <tr key={enc.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-mono text-muted-foreground">
                        {String(enc.id).padStart(4, "0")}
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="font-medium leading-tight">{enc.produto}</p>
                        <p className="text-xs text-muted-foreground">{enc.clienteNome}</p>
                      </td>
                      <td className="hidden px-4 py-2.5 text-muted-foreground md:table-cell">
                        {enc.clienteNome}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                        {qty.format(enc.qtdPedida)}{" "}
                        <span className="text-xs">{enc.unidade}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <EstadoSelect encomenda={enc} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
