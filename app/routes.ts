import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("layouts/app-layout.tsx", [
    index("routes/dashboard.tsx"),
    route("clientes", "routes/clientes.tsx"),
    route("clientes/:id", "routes/clientes.$id.tsx"),
    route("produtos", "routes/produtos.tsx"),
    route("fila", "routes/fila.tsx"),
    route("atualizacao", "routes/atualizacao.tsx"),
    route("prejuizos", "routes/prejuizos.tsx"),
    route("relatorio", "routes/relatorio.tsx"),
  ]),
  route("api/encomendas/detalhe", "routes/api.encomendas.detalhe.ts"),
  route("api/encomenda-estado", "routes/api.encomenda-estado.ts"),
] satisfies RouteConfig;
