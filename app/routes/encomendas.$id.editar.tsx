import { redirect, useActionData } from "react-router";
import { ClipboardList } from "lucide-react";
import type { Route } from "./+types/encomendas.$id.editar";
import { requireUsuario } from "~/lib/auth.server";
import { buscarDetalheEncomenda, alterarEncomenda } from "~/lib/api";
import { EncomendaFormulario } from "~/components/encomenda-formulario";

export const handle = { title: "Editar Encomenda" };

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `Editar Encomenda #${params.id} — Empac` }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireUsuario(request);
  const id = Number(params.id);
  if (!id) throw new Response("ID inválido", { status: 400 });
  const encomenda = await buscarDetalheEncomenda(id);
  return { encomenda };
}

export async function action({ request, params }: Route.ActionArgs) {
  await requireUsuario(request);
  const id = Number(params.id);
  if (!id) throw new Response("ID inválido", { status: 400 });

  const fd = await request.formData();
  const get = (k: string) => String(fd.get(k) ?? "");
  const getNum = (k: string) => Number(fd.get(k) ?? 0);

  const resultado = await alterarEncomenda(id, {
    pr1: get("pr1"),
    pr2: get("pr2"),
    pr3: getNum("pr3"),
    pr4: get("pr4"),
    pr5: getNum("pr5"),
    pr6: get("pr6"),
    pr9: getNum("pr9"),
    pr10: getNum("pr10"),
    pr11: getNum("pr11"),
    pr12: getNum("pr12"),
    pr13: get("pr13"),
    pr14: getNum("pr14"),
    pr15: get("pr15"),
    pr16: get("pr16"),
    pr17: get("pr17"),
    pr23: getNum("pr23"),
    pr24: getNum("pr24"),
    pr25: getNum("pr25"),
  });

  if (resultado.erro) {
    return { erro: resultado.erro };
  }

  return redirect("/fila");
}

export default function EditarEncomenda({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { encomenda } = loaderData;

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="size-6" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Editar Encomenda{" "}
            <span className="font-mono text-muted-foreground">
              #{String(encomenda.id).padStart(4, "0")}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {encomenda.clienteNome} — {encomenda.produto}
          </p>
        </div>
      </div>

      <EncomendaFormulario
        encomenda={encomenda}
        erro={(actionData as { erro?: string } | undefined)?.erro}
      />
    </main>
  );
}
