FROM node:25-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ] ; then npm ci ; else npm install ; fi

COPY . .
RUN npm run build

FROM node:25-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV ASTRO_TELEMETRY_DISABLED=1
ENV HOST=0.0.0.0
ENV PORT=4321

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ] ; then npm ci --omit=dev ; else npm install --omit=dev ; fi

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]
