# =====================================================
# Bia Visitas API — Dockerfile multi-stage
# Reto 2 Semana 5 · AI Native Bia
# =====================================================

# ---------- Stage 1: instalar deps ----------
FROM node:22-alpine AS deps

WORKDIR /app
COPY package*.json ./

# Solo deps de producción para la imagen final
RUN npm ci --omit=dev --no-audit --no-fund

# ---------- Stage 2: imagen final ----------
FROM node:22-alpine AS runner

# Usuario no-root (mejor práctica de seguridad)
RUN addgroup -g 1001 -S nodejs \
 && adduser  -S app -u 1001

WORKDIR /app

# Copiar solo lo estrictamente necesario
COPY --from=deps --chown=app:nodejs /app/node_modules ./node_modules
COPY --chown=app:nodejs src ./src
COPY --chown=app:nodejs package.json ./

# Crear carpeta de datos persistente
RUN mkdir -p /app/data && chown -R app:nodejs /app/data
VOLUME ["/app/data"]

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/visitas.db

USER app

EXPOSE 3000

# Healthcheck que el orquestador (k8s, ECS, etc.) puede leer
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "--experimental-sqlite", "src/server.js"]
