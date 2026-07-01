import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  // Rotas públicas (sem layout autenticado)
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.ts"),
  route("trocar-senha", "routes/trocar-senha.tsx"),

  // Rotas protegidas (dentro do layout autenticado)
  layout("layouts/app-layout.tsx", [
    index("routes/dashboard.tsx"),
    route("clientes", "routes/clientes.tsx"),
    route("clientes/:id", "routes/clientes.$id.tsx"),
    route("produtos", "routes/produtos.tsx"),
    route("fila", "routes/fila.tsx"),
    route("planilha/:id", "routes/planilha.$id.tsx"),
    route("atualizacao", "routes/atualizacao.tsx"),
    route("prejuizos", "routes/prejuizos.tsx"),
    route("relatorio", "routes/relatorio.tsx"),
    route("admin/usuarios", "routes/admin.usuarios.tsx"),
    route("admin/fator", "routes/admin.fator.tsx"),
    route("encomendas/nova", "routes/encomendas.nova.tsx"),
    route("encomendas/:id/editar", "routes/encomendas.$id.editar.tsx"),
  ]),

  // API routes (sem layout)
  route("api/cliente", "routes/api.cliente.ts"),
  route("api/clientes", "routes/api.clientes.ts"),
  route("api/encomendas/detalhe", "routes/api.encomendas.detalhe.ts"),
  route("api/encomenda-estado", "routes/api.encomenda-estado.ts"),
  route("api/planilha", "routes/api.planilha.ts"),
] satisfies RouteConfig;
