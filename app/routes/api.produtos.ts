import type { Route } from "./+types/api.produtos";
import { listarProdutos } from "~/lib/api";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const nome = url.searchParams.get("nome") ?? "";
  const limite = Math.min(Number(url.searchParams.get("limite") ?? 20), 50);
  const data = await listarProdutos({ nome, limite });
  return Response.json(data);
}
