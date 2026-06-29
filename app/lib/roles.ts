export type Role = "admin" | "gerente" | "operador";

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  operador: "Operador",
};

export const ROLE_LEVEL: Record<Role, number> = {
  operador: 1,
  gerente: 2,
  admin: 3,
};
