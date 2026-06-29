import { Form, useActionData, useLoaderData } from "react-router";
import type { Route } from "./+types/admin.usuarios";
import {
  criarUsuario,
  deletarUsuario,
  listarUsuarios,
  requireAdmin,
  resetarSenha,
  atualizarUsuario,
} from "~/lib/auth.server";
import { ROLE_LABEL, type Role } from "~/lib/roles";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { UserPlusIcon, KeyRoundIcon, Trash2Icon, ShieldIcon } from "lucide-react";

export const handle = { title: "Usuários" };

export function meta({}: Route.MetaArgs) {
  return [{ title: "Usuários — Empac" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const me = await requireAdmin(request);
  const usuarios = listarUsuarios().map(({ passwordHash: _, salt: __, ...u }) => u);
  return { usuarios, meId: me.id };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const form = await request.formData();
  const intent = String(form.get("_action") ?? "");

  try {
    if (intent === "criar") {
      const email = String(form.get("email") ?? "").trim();
      const nome = String(form.get("nome") ?? "").trim();
      const role = String(form.get("role") ?? "") as Role;
      const senha = String(form.get("senha") ?? "");
      const confirmar = String(form.get("confirmar") ?? "");

      if (!email || !nome || !role || !senha) return { erro: "Preencha todos os campos." };
      if (senha.length < 6) return { erro: "Senha mínima de 6 caracteres." };
      if (senha !== confirmar) return { erro: "As senhas não conferem." };

      criarUsuario({ email, nome, role, senha });
      return { ok: `Usuário ${nome} criado. Senha inicial: ${senha}` };
    }

    if (intent === "atualizar-role") {
      const id = String(form.get("id") ?? "");
      const role = String(form.get("role") ?? "") as Role;
      atualizarUsuario(id, { role });
      return { ok: "Perfil atualizado." };
    }

    if (intent === "resetar-senha") {
      const id = String(form.get("id") ?? "");
      const novaSenha = resetarSenha(id);
      return { ok: `Senha redefinida para: ${novaSenha}` };
    }

    if (intent === "deletar") {
      const id = String(form.get("id") ?? "");
      deletarUsuario(id);
      return { ok: "Usuário removido." };
    }
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Erro inesperado." };
  }

  return null;
}

const ROLE_COLOR: Record<Role, string> = {
  admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  gerente: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  operador: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export default function AdminUsuarios() {
  const { usuarios, meId } = useLoaderData<typeof loader>();
  const data = useActionData<typeof action>();

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="flex items-center gap-2">
        <ShieldIcon className="size-5 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Gerenciar Usuários</h1>
      </div>

      {/* Feedback */}
      {data && "ok" in data && (
        <p className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
          {data.ok}
        </p>
      )}
      {data && "erro" in data && (
        <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {data.erro}
        </p>
      )}

      {/* Tabela de usuários */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.nome}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLOR[u.role]}`}
                  >
                    {ROLE_LABEL[u.role]}
                  </span>
                </TableCell>
                <TableCell>
                  {u.trocarSenha ? (
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                      Troca senha
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                      Ativo
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    {/* Alterar perfil */}
                    <Form method="post" className="flex items-center gap-1">
                      <input type="hidden" name="_action" value="atualizar-role" />
                      <input type="hidden" name="id" value={u.id} />
                      <Select name="role" defaultValue={u.role}>
                        <SelectTrigger className="h-7 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                            <SelectItem key={r} value={r} className="text-xs">
                              {ROLE_LABEL[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="submit" size="sm" variant="outline" className="h-7 px-2 text-xs">
                        Salvar
                      </Button>
                    </Form>

                    {/* Resetar senha */}
                    <Form method="post">
                      <input type="hidden" name="_action" value="resetar-senha" />
                      <input type="hidden" name="id" value={u.id} />
                      <Button
                        type="submit"
                        size="icon"
                        variant="ghost"
                        className="size-7 text-amber-500 hover:text-amber-600"
                        title="Redefinir senha"
                        onClick={(e) => {
                          if (!confirm(`Redefinir senha de ${u.nome}?`)) e.preventDefault();
                        }}
                      >
                        <KeyRoundIcon className="size-3.5" />
                      </Button>
                    </Form>

                    {/* Deletar (não deixa deletar a si mesmo) */}
                    {u.id !== meId && (
                      <Form method="post">
                        <input type="hidden" name="_action" value="deletar" />
                        <input type="hidden" name="id" value={u.id} />
                        <Button
                          type="submit"
                          size="icon"
                          variant="ghost"
                          className="size-7 text-destructive hover:text-destructive"
                          title="Remover usuário"
                          onClick={(e) => {
                            if (!confirm(`Remover ${u.nome}? Esta ação não pode ser desfeita.`))
                              e.preventDefault();
                          }}
                        >
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      </Form>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Formulário de novo usuário */}
      <div className="rounded-lg border p-6">
        <div className="mb-4 flex items-center gap-2">
          <UserPlusIcon className="size-4 text-muted-foreground" />
          <h2 className="font-medium">Novo usuário</h2>
        </div>

        <Form method="post" className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="_action" value="criar" />

          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" placeholder="Nome completo" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" placeholder="usuario@empac.com.br" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="role">Perfil</Label>
            <Select name="role" defaultValue="operador">
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="senha-nova">Senha inicial</Label>
            <Input
              id="senha-nova"
              name="senha"
              type="text"
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmar-nova">Confirmar senha</Label>
            <Input id="confirmar-nova" name="confirmar" type="text" required minLength={6} />
          </div>

          <div className="flex items-end">
            <Button type="submit" className="w-full">
              Criar usuário
            </Button>
          </div>
        </Form>

        <p className="mt-3 text-xs text-muted-foreground">
          O usuário deverá alterar a senha no primeiro acesso.
        </p>
      </div>
    </main>
  );
}
