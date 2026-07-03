import { redirect } from "react-router";
import { PackagePlus } from "lucide-react";
import type { Route } from "./+types/produtos.$id.editar";
import { requireMinRole } from "~/lib/auth.server";
import { alterarProduto, obterProduto } from "~/lib/api";
import { ProdutoFormulario } from "~/components/produto-formulario";

export const handle = { title: "Editar Produto" };

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `Editar Produto ${params.id} — Empac` }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireMinRole(request, "gerente");
  const id = Number(params.id);
  if (!id) throw new Response("ID inválido", { status: 400 });
  const produto = await obterProduto(id);
  return { produto };
}

export async function action({ request, params }: Route.ActionArgs) {
  await requireMinRole(request, "gerente");
  const id = Number(params.id);
  if (!id) throw new Response("ID inválido", { status: 400 });

  const fd = await request.formData();
  const get = (k: string) => String(fd.get(k) ?? "");
  const getNum = (k: string) => Number(fd.get(k) ?? 0);

  const resultado = await alterarProduto(id, {
    descricao: get("descricao"),
    unidade: get("unidade"),
    custo: getNum("custo"),
    venda: getNum("venda"),
    local: get("local"),
    peso: getNum("peso"),
    origem: get("origem"),
    classifFiscal: get("classifFiscal"),
    tributadoIpi: get("tributadoIpi"),
  });

  if (resultado.erro) {
    return { erro: resultado.erro };
  }

  return redirect("/produtos");
}

export default function EditarProdutoPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { produto } = loaderData;

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <PackagePlus className="size-6" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Editar Produto{" "}
            <span className="font-mono text-muted-foreground">
              P{produto.id}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">{produto.descricao}</p>
        </div>
      </div>

      <ProdutoFormulario
        produto={produto}
        erro={(actionData as { erro?: string } | undefined)?.erro}
      />
    </main>
  );
}
