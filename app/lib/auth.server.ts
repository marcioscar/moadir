import { createCookieSessionStorage, redirect } from "react-router";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ROLE_LEVEL, type Role } from "~/lib/roles";

export type { Role } from "~/lib/roles";
export { ROLE_LABEL, ROLE_LEVEL } from "~/lib/roles";

export type Usuario = {
  id: string;
  email: string;
  nome: string;
  role: Role;
  passwordHash: string;
  salt: string;
  trocarSenha: boolean;
  criadoEm: string;
};

// ── Arquivo de usuários ───────────────────────────────────────────────────────
const DATA_DIR = process.env.DATA_DIR ?? "data";
const USERS_FILE = path.join(DATA_DIR, "users.json");

function lerUsuarios(): Usuario[] {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8")) as Usuario[];
  } catch {
    return [];
  }
}

function salvarUsuarios(users: Usuario[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

function garantirAdmin(): void {
  const users = lerUsuarios();
  if (users.length === 0) {
    const salt = crypto.randomBytes(16).toString("hex");
    const admin: Usuario = {
      id: crypto.randomUUID(),
      email: "admin@empac.com.br",
      nome: "Administrador",
      role: "admin",
      passwordHash: hashSenha("Empac@2024", salt),
      salt,
      trocarSenha: true,
      criadoEm: new Date().toISOString(),
    };
    salvarUsuarios([admin]);
  }
}

// Cria admin padrão na primeira inicialização
garantirAdmin();

// ── Senhas ────────────────────────────────────────────────────────────────────
export function hashSenha(senha: string, salt: string): string {
  return crypto.scryptSync(senha, salt, 64).toString("hex");
}

export function verificarSenha(senha: string, salt: string, hash: string): boolean {
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hashSenha(senha, salt), "hex"),
      Buffer.from(hash, "hex"),
    );
  } catch {
    return false;
  }
}

// ── CRUD de usuários ──────────────────────────────────────────────────────────
export function buscarPorEmail(email: string): Usuario | undefined {
  return lerUsuarios().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function buscarPorId(id: string): Usuario | undefined {
  return lerUsuarios().find((u) => u.id === id);
}

export function listarUsuarios(): Usuario[] {
  return lerUsuarios();
}

export function criarUsuario(dados: {
  email: string;
  nome: string;
  role: Role;
  senha: string;
}): Usuario {
  const users = lerUsuarios();
  if (users.some((u) => u.email.toLowerCase() === dados.email.toLowerCase())) {
    throw new Error("E-mail já cadastrado");
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const user: Usuario = {
    id: crypto.randomUUID(),
    email: dados.email,
    nome: dados.nome,
    role: dados.role,
    passwordHash: hashSenha(dados.senha, salt),
    salt,
    trocarSenha: true,
    criadoEm: new Date().toISOString(),
  };
  salvarUsuarios([...users, user]);
  return user;
}

export function atualizarSenha(id: string, novaSenha: string): void {
  const users = lerUsuarios();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) throw new Error("Usuário não encontrado");
  const salt = crypto.randomBytes(16).toString("hex");
  users[idx] = {
    ...users[idx],
    passwordHash: hashSenha(novaSenha, salt),
    salt,
    trocarSenha: false,
  };
  salvarUsuarios(users);
}

export function atualizarUsuario(
  id: string,
  dados: Partial<Pick<Usuario, "nome" | "role">>,
): void {
  const users = lerUsuarios();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) throw new Error("Usuário não encontrado");
  users[idx] = { ...users[idx], ...dados };
  salvarUsuarios(users);
}

export function resetarSenha(id: string): string {
  const novaSenha = "Trocar@123";
  const users = lerUsuarios();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) throw new Error("Usuário não encontrado");
  const salt = crypto.randomBytes(16).toString("hex");
  users[idx] = {
    ...users[idx],
    passwordHash: hashSenha(novaSenha, salt),
    salt,
    trocarSenha: true,
  };
  salvarUsuarios(users);
  return novaSenha;
}

export function deletarUsuario(id: string): void {
  const users = lerUsuarios();
  salvarUsuarios(users.filter((u) => u.id !== id));
}

// ── Sessão ────────────────────────────────────────────────────────────────────
const SESSION_SECRET =
  process.env.SESSION_SECRET ?? "dev-secret-moadir-change-in-production";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
  },
});

export async function getSession(request: Request) {
  return sessionStorage.getSession(request.headers.get("Cookie"));
}

export async function getUsuarioLogado(request: Request): Promise<Usuario | null> {
  const session = await getSession(request);
  const userId = session.get("userId") as string | undefined;
  if (!userId) return null;
  return buscarPorId(userId) ?? null;
}

export async function requireUsuario(request: Request): Promise<Usuario> {
  const user = await getUsuarioLogado(request);
  if (!user) throw redirect("/login");
  if (user.trocarSenha) {
    const { pathname } = new URL(request.url);
    if (!pathname.startsWith("/trocar-senha") && !pathname.startsWith("/logout")) {
      throw redirect("/trocar-senha");
    }
  }
  return user;
}

export async function requireMinRole(
  request: Request,
  minRole: Role,
): Promise<Usuario> {
  const user = await requireUsuario(request);
  if (ROLE_LEVEL[user.role] < ROLE_LEVEL[minRole]) {
    throw new Response("Acesso não autorizado para este perfil.", { status: 403 });
  }
  return user;
}

export async function requireAdmin(request: Request): Promise<Usuario> {
  return requireMinRole(request, "admin");
}

export async function criarSessao(userId: string, request: Request): Promise<string> {
  const session = await getSession(request);
  session.set("userId", userId);
  return sessionStorage.commitSession(session);
}

export async function destruirSessao(request: Request): Promise<string> {
  const session = await getSession(request);
  return sessionStorage.destroySession(session);
}
