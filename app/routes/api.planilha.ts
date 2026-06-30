import type { Route } from "./+types/api.planilha";
import { obterPlanilha } from "~/lib/api";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  if (!id) {
    return Response.json({ erro: "id obrigatório" }, { status: 400 });
  }
  const data = await obterPlanilha(id);

  return Response.json(data);
}
