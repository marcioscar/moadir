# Imagem base com pnpm habilitado via corepack.
FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

# Dependências completas (para o build).
FROM base AS build
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Só dependências de produção (imagem final enxuta).
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Imagem final.
FROM base
ENV NODE_ENV=production
# Porta do react-router-serve (padrão 3000). Ajuste se necessário.
ENV PORT=3000
COPY package.json pnpm-lock.yaml ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
EXPOSE 3000
CMD ["pnpm", "run", "start"]
