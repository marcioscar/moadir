import { Form, redirect, useActionData, useLoaderData } from "react-router";
import type { Route } from "./+types/trocar-senha";
import {
  atualizarSenha,
  buscarPorId,
  destruirSessao,
  getSession,
} from "~/lib/auth.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Alterar senha — Empac" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  const userId = session.get("userId") as string | undefined;
  if (!userId) throw redirect("/login");
  const user = buscarPorId(userId);
  if (!user) throw redirect("/login");
  // Se já não precisa trocar, vai para home
  if (!user.trocarSenha) throw redirect("/");
  return { nome: user.nome };
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request);
  const userId = session.get("userId") as string | undefined;
  if (!userId) throw redirect("/login");

  const form = await request.formData();

  if (form.get("_action") === "logout") {
    const cookie = await destruirSessao(request);
    throw redirect("/login", { headers: { "Set-Cookie": cookie } });
  }

  const nova = String(form.get("nova") ?? "");
  const confirmar = String(form.get("confirmar") ?? "");

  if (nova.length < 6) {
    return { erro: "A senha deve ter pelo menos 6 caracteres." };
  }
  if (nova !== confirmar) {
    return { erro: "As senhas não conferem." };
  }

  atualizarSenha(userId, nova);
  throw redirect("/");
}

export default function TrocarSenha() {
  const { nome } = useLoaderData<typeof loader>();
  const data = useActionData<typeof action>();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-background p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2">
          <img
            src="/LogoEmpac1.png"
            alt="Empac Agroindustrial de Plásticos"
            className="h-14 w-auto object-contain dark:brightness-0 dark:invert"
          />
          <h1 className="text-lg font-semibold">Olá, {nome}</h1>
          <p className="text-center text-sm text-muted-foreground">
            Por segurança, defina uma nova senha antes de continuar.
          </p>
        </div>

        <Form method="post" className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nova">Nova senha</Label>
            <Input
              id="nova"
              name="nova"
              type="password"
              autoComplete="new-password"
              autoFocus
              required
              minLength={6}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmar">Confirmar senha</Label>
            <Input
              id="confirmar"
              name="confirmar"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>

          {data?.erro && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {data.erro}
            </p>
          )}

          <Button type="submit" className="w-full">
            Salvar e continuar
          </Button>
        </Form>

        <Form method="post">
          <input type="hidden" name="_action" value="logout" />
          <Button type="submit" variant="ghost" className="w-full text-muted-foreground">
            Cancelar e sair
          </Button>
        </Form>
      </div>
    </div>
  );
}
