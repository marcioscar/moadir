import { Form, redirect, useActionData } from "react-router";
import type { Route } from "./+types/login";
import { buscarPorEmail, criarSessao, getUsuarioLogado, verificarSenha } from "~/lib/auth.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Entrar — Empac" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUsuarioLogado(request);
  if (user) throw redirect(user.trocarSenha ? "/trocar-senha" : "/");
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const senha = String(form.get("senha") ?? "");

  if (!email || !senha) {
    return { erro: "Preencha e-mail e senha." };
  }

  const user = buscarPorEmail(email);
  if (!user || !verificarSenha(senha, user.salt, user.passwordHash)) {
    return { erro: "E-mail ou senha incorretos." };
  }

  const cookie = await criarSessao(user.id, request);
  const destino = user.trocarSenha ? "/trocar-senha" : "/";
  throw redirect(destino, { headers: { "Set-Cookie": cookie } });
}

export default function Login() {
  const data = useActionData<typeof action>();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-background p-8 shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <img
            src="/LogoEmpac1.png"
            alt="Empac Agroindustrial de Plásticos"
            className="h-16 w-auto object-contain dark:brightness-0 dark:invert"
          />
          <p className="text-sm text-muted-foreground">Acesse sua conta</p>
        </div>

        <Form method="post" className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              required
              placeholder="usuario@empac.com.br"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          {data?.erro && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {data.erro}
            </p>
          )}

          <Button type="submit" className="w-full">
            Entrar
          </Button>
        </Form>
      </div>
    </div>
  );
}
