import type { Route } from "./+types/api.encomenda-estado";
import { atualizarEstadoEncomenda } from "~/lib/api";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const id = Number(formData.get("id"));
  const estado = Number(formData.get("estado"));
  if (!id || estado < 0 || estado > 8) {
    return Response.json({ erro: "Parâmetros inválidos" }, { status: 400 });
  }
  const data = await atualizarEstadoEncomenda(id, estado);
  return Response.json(data);
}
