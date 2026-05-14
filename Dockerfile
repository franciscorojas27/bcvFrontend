FROM node:22-slim AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ] ; then npm ci ; else npm install ; fi

COPY . .
RUN npm run build

# remove devDependencies to keep only production deps
RUN npm prune --production

FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV ASTRO_TELEMETRY_DISABLED=1
ENV HOST=0.0.0.0
ENV PORT=4321

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]
