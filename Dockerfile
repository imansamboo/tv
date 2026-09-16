# syntax=docker/dockerfile:1

ARG NODE_VERSION=22-bookworm-slim

FROM node:${NODE_VERSION} AS base
# Prisma selects its engines by OpenSSL version, which slim images do not ship.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

FROM base AS deps
# The prisma schema is needed here because `postinstall` runs `prisma generate`.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
# The runtime image has no tsx, so the seed script is compiled to plain JS here.
RUN npx tsc prisma/seed.ts \
  --outDir ./seed-dist \
  --module commonjs \
  --target es2022 \
  --moduleResolution node \
  --esModuleInterop \
  --skipLibCheck

# Installed separately so the runtime keeps the CLI (used to sync the SQLite
# schema on startup) without the rest of the build-time dependency tree.
FROM base AS prisma-cli
WORKDIR /opt/prisma
COPY package.json ./
# The engine binaries shipped with the CLI are kept as-is: if any are missing,
# the CLI tries to download them on every start and stalls without egress.
RUN prisma_version="$(node -p "require('./package.json').devDependencies.prisma")" \
  && rm package.json \
  && npm init -y > /dev/null \
  && npm install --omit=optional --no-audit --no-fund "prisma@${prisma_version}" \
  && rm -rf /root/.npm

FROM base AS runner
ENV NODE_ENV=production \
  PORT=3000 \
  HOSTNAME=0.0.0.0 \
  DATABASE_URL=file:/app/data/parstv.db \
  PRISMA_CLI=/opt/prisma/node_modules/prisma/build/index.js \
  CHECKPOINT_DISABLE=1

# The CLI verifies it can write to its own engines directory before running.
COPY --from=prisma-cli --chown=node:node /opt/prisma/node_modules /opt/prisma/node_modules
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
# Output tracing keeps only the ESM entry of bcryptjs, which the app imports.
# The compiled seed below is CommonJS, so it needs the package's CJS build too.
COPY --from=builder --chown=node:node /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder --chown=node:node /app/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=builder --chown=node:node /app/seed-dist/seed.js ./prisma/seed.js
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# `package.json#prisma` points the CLI at a tsx seed that this image does not
# use, and only makes the CLI print a deprecation warning on every start.
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
  && mkdir -p /app/data /app/.next/cache \
  && chown -R node:node /app/data /app/.next/cache \
  && node -e "const f='/app/package.json',p=require(f);delete p.prisma;require('fs').writeFileSync(f,JSON.stringify(p,null,2)+'\n')"

USER node
EXPOSE 3000
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/auth/me').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
