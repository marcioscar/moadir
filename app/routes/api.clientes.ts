import type { Route } from "./+types/api.clientes";
import { listarClientes } from "~/lib/api";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const nome = url.searchParams.get("nome") ?? "";
  const limite = Math.min(Number(url.searchParams.get("limite") ?? 20), 50);
  const data = await listarClientes({ nome, limite });
  return Response.json(data);
}
