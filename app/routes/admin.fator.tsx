import { Form, useActionData, useLoaderData } from "react-router";
import type { Route } from "./+types/admin.fator";
import { definirFator, listarFatores } from "~/lib/api";
import { requireAdmin } from "~/lib/auth.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { TrendingUpIcon } from "lucide-react";

export const handle = { title: "Fatores de Preço" };

export function meta({}: Route.MetaArgs) {
  return [{ title: "Fatores de Preço — Empac" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  return listarFatores(30);
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const form = await request.formData();
  const ano = String(form.get("ano") ?? "").trim().padStart(2, "0");
  const semana = String(form.get("semana") ?? "").trim().padStart(2, "0");
  const valor = Number(form.get("valor"));

  if (!ano.match(/^\d{2}$/) || !semana.match(/^\d{2}$/)) {
    return { ok: false as const, erro: "Ano e semana devem ter 2 dígitos cada." };
  }
  if (!valor || valor < 1) {
    return { ok: false as const, erro: "Fator deve ser um número maior que zero." };
  }

  const chave = ano + semana;
  const res = await definirFator(chave, valor);
  if (!res.ok) return { ok: false as const, erro: res.erro ?? "Erro ao salvar." };
  return { ok: true as const, semana: res.semana, fator: res.fator };
}

const mult = (fator: number) =>
  (fator / 10000).toLocaleString("pt-BR", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });

export default function AdminFator() {
  const { semanaAtual, fatorAtual, markup, fatores } = useLoaderData<typeof loader>();
  const data = useActionData<typeof action>();

  const [anoAtual, semAtual] = semanaAtual.split("/");

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-6">
      <div className="flex items-center gap-2">
        <TrendingUpIcon className="size-5 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Fatores de Preço Semanais</h1>
      </div>

      {/* Situação atual */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground">Semana atual</p>
          <p className="text-2xl font-bold tracking-tight">{semanaAtual}</p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground">Fator atual</p>
          <p className="text-2xl font-bold tracking-tight">{fatorAtual.toLocaleString("pt-BR")}</p>
          <p className="text-xs text-muted-foreground">×{mult(fatorAtual)}</p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground">Mark-up</p>
          <p className="text-2xl font-bold tracking-tight">{markup.toLocaleString("pt-BR")}</p>
          <p className="text-xs text-muted-foreground">
            {(markup / 100).toLocaleString("pt-BR", { minimumFractionDigits: 1 })}%
          </p>
        </div>
      </div>

      {/* Feedback */}
      {data?.ok === true && (
        <p className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
          Fator da semana {data.semana} salvo: {data.fator?.toLocaleString("pt-BR")} (×{mult(data.fator ?? 0)})
        </p>
      )}
      {data?.ok === false && (
        <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {data.erro}
        </p>
      )}

      {/* Formulário de novo fator */}
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 font-medium">Cadastrar fator da semana</h2>
        <Form method="post" className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="ano">Ano (AA)</Label>
            <Input
              id="ano"
              name="ano"
              className="w-20 font-mono"
              maxLength={2}
              placeholder={anoAtual}
              defaultValue={anoAtual}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="semana">Semana (SS)</Label>
            <Input
              id="semana"
              name="semana"
              className="w-20 font-mono"
              maxLength={2}
              placeholder={semAtual}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="valor">Fator</Label>
            <Input
              id="valor"
              name="valor"
              type="number"
              className="w-32 font-mono"
              placeholder={String(fatorAtual)}
              min={1}
              required
            />
          </div>
          <Button type="submit">Salvar</Button>
        </Form>
        <p className="mt-3 text-xs text-muted-foreground">
          Fórmula: preço atual = preço base × fator ÷ 10 000.
          Exemplo: fator 19 401 → multiplicador ×1,9401.
        </p>
      </div>

      {/* Tabela de histórico */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Semana</TableHead>
              <TableHead className="text-right">Fator</TableHead>
              <TableHead className="text-right">Multiplicador</TableHead>
              <TableHead className="text-right">Variação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fatores.map((f, i) => {
              const anterior = fatores[i + 1]?.fator;
              const variacao = anterior ? ((f.fator - anterior) / anterior) * 100 : null;
              return (
                <TableRow key={f.chave} className={f.chave === semanaAtual.replace("/", "") ? "bg-muted/40" : ""}>
                  <TableCell className="font-mono">
                    {f.semana}
                    {f.chave === semanaAtual.replace("/", "") && (
                      <Badge variant="secondary" className="ml-2 text-[10px]">
                        atual
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {f.fator.toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                    ×{mult(f.fator)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {variacao !== null ? (
                      <span className={variacao > 0 ? "text-red-600" : variacao < 0 ? "text-green-600" : "text-muted-foreground"}>
                        {variacao > 0 ? "+" : ""}
                        {variacao.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
