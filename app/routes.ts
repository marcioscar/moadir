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
    route("relatorio", "routes/relatorio.tsx"),
  ]),
] satisfies RouteConfig;
