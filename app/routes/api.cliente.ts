import type { Route } from "./+types/api.cliente";
import { obterCliente } from "~/lib/api";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id") ?? 0);
  if (!id) return Response.json({ erro: "id obrigatório" });
  try {
    const data = await obterCliente(id);
    return Response.json(data);
  } catch {
    return Response.json({ erro: "cliente não encontrado" });
  }
}
