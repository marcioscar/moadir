import { redirect } from "react-router";
import { PackagePlus } from "lucide-react";
import type { Route } from "./+types/produtos.novo";
import { requireMinRole } from "~/lib/auth.server";
import { criarProduto } from "~/lib/api";
import { ProdutoFormulario } from "~/components/produto-formulario";

export const handle = { title: "Novo Produto" };

export function meta({}: Route.MetaArgs) {
  return [{ title: "Novo Produto — Empac" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireMinRole(request, "gerente");
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  await requireMinRole(request, "gerente");

  const fd = await request.formData();
  const get = (k: string) => String(fd.get(k) ?? "");
  const getNum = (k: string) => Number(fd.get(k) ?? 0);

  const resultado = await criarProduto({
    codigo: getNum("codigo"),
    descricao: get("descricao"),
    unidade: get("unidade"),
    custo: getNum("custo"),
    venda: getNum("venda"),
    local: get("local"),
    peso: getNum("peso"),
    origem: get("origem"),
    classifFiscal: get("classifFiscal"),
    tributadoIpi: get("tributadoIpi"),
    modeloId: getNum("modeloId") || undefined,
  });

  if (resultado.erro) {
    return { erro: resultado.erro };
  }

  return redirect("/produtos");
}

export default function NovoProdutoPage({
  actionData,
}: Route.ComponentProps) {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <PackagePlus className="size-6" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Novo Produto
          </h1>
          <p className="text-sm text-muted-foreground">
            Matéria-prima, hora-máquina ou qualquer item cadastrado no ^EPR.
          </p>
        </div>
      </div>

      <ProdutoFormulario
        erro={(actionData as { erro?: string } | undefined)?.erro}
      />
    </main>
  );
}
