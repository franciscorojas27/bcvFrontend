FROM node:22-slim AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install

COPY . .
RUN pnpm run build

RUN pnpm prune --prod

FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV ASTRO_TELEMETRY_DISABLED=1
ENV HOST=0.0.0.0
ENV PORT=4321

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]
