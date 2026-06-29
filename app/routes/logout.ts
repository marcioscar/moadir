import { redirect } from "react-router";
import type { Route } from "./+types/logout";
import { destruirSessao } from "~/lib/auth.server";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") throw new Response("Method not allowed", { status: 405 });
  const cookie = await destruirSessao(request);
  throw redirect("/login", { headers: { "Set-Cookie": cookie } });
}

export async function loader() {
  throw redirect("/login");
}
