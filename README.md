# moadir — Dashboard EMPAC

Dashboard administrativo da **EMPAC** (clientes, produtos, relatórios de
prejuízo) que consome a API do ERP em YottaDB.

🔗 **Produção:** https://2.25.175.240.nip.io

- **Stack:** React Router 8 (SSR) · React 19 · Tailwind v4 · shadcn/ui · TanStack Table
- **Dados:** API REST do ERP (YottaDB) na VPS, consumida nos `loader`s (server-side, sem CORS)

## Documentação

| Guia | Conteúdo |
|---|---|
| 📄 [Editar e adicionar rotinas na API (YottaDB)](docs/api-yottadb.md) · [PDF](docs/api-yottadb.pdf) | Como editar/criar rotinas MUMPS e expô-las como endpoints |

## Desenvolvimento

```bash
pnpm install
pnpm run dev          # http://localhost:5173
pnpm run typecheck    # valida tipos (roda também no CI)
pnpm run build        # build de produção
```

A API padrão é a pública (`http://2.25.175.240:9080`); pode sobrescrever com a
variável de ambiente `API_BASE`.

## Deploy

**Automático:** basta `git push` na branch `main`. A VPS publica sozinha em
~1 min (deploy *pull* via systemd timer — ver `deploy/`). O GitHub Actions
roda só o typecheck (CI).

**Manual** (na VPS): `ssh Moadir 'bash /opt/moadir/deploy/setup.sh'`

Estrutura de deploy em [`deploy/`](deploy/): `setup.sh` (provisiona/atualiza),
`pull-deploy.sh` + units do `systemd` (timer), `nginx-moadir.conf`,
`moadir.service`.

## Estrutura

```
app/
  routes/           # páginas (dashboard, clientes, produtos, relatorio)
  components/ui/     # shadcn + DataTable reutilizável
  lib/api.ts         # cliente HTTP da API do ERP
deploy/              # scripts e configs de deploy (systemd, nginx)
docs/                # documentação
```
