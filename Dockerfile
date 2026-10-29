# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Cache dependency installation until either lockfile changes.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN npm ci --prefix frontend --no-audit --no-fund

COPY frontend/ ./frontend/
COPY catalogue/public-catalogue.json ./catalogue/public-catalogue.json
COPY scripts/build-seo.mjs ./scripts/build-seo.mjs
RUN npm run build --prefix frontend && node scripts/build-seo.mjs

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=8080 HOST=0.0.0.0 INDEXING_ENABLED=false
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/frontend/dist ./frontend/dist
COPY --from=build --chown=node:node /app/catalogue/public-catalogue.json ./catalogue/public-catalogue.json
COPY --chown=node:node server/ ./server/
COPY --chown=node:node package.json ./package.json
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/start.cjs"]
