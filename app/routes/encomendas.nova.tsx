import { redirect, Form, useActionData, useNavigation } from "react-router";
import { ClipboardList, Loader2 } from "lucide-react";
import type { Route } from "./+types/encomendas.nova";
import { requireUsuario } from "~/lib/auth.server";
import { criarEncomenda } from "~/lib/api";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { EncomendaFormulario } from "~/components/encomenda-formulario";

export const handle = { title: "Nova Encomenda" };

export function meta({}: Route.MetaArgs) {
  return [{ title: "Nova Encomenda — Empac" }];
}

export async function action({ request }: Route.ActionArgs) {
  await requireUsuario(request);
  const fd = await request.formData();

  const get = (k: string) => String(fd.get(k) ?? "");
  const getNum = (k: string) => Number(fd.get(k) ?? 0);

  const resultado = await criarEncomenda({
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

export default function NovaEncomenda({ actionData }: Route.ComponentProps) {
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="size-6" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Nova Encomenda
          </h1>
          <p className="text-sm text-muted-foreground">
            Preencha os dados do pedido de fabricação.
          </p>
        </div>
      </div>

      <EncomendaFormulario
        erro={(actionData as { erro?: string } | undefined)?.erro}
      />
    </main>
  );
}
