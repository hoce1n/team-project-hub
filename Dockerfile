# syntax=docker/dockerfile:1

########################
# deps — full dependency tree (dev + prod)
########################
FROM node:22-bookworm-slim AS deps
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN npm install -g pnpm@11.24.0
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

########################
# builder — generate Prisma client, build Next.js standalone
########################
FROM deps AS builder
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_STANDALONE=1
ENV DATABASE_URL="postgresql://tp_hub:tp_hub_dev@postgres:5432/tp_hub?schema=public"
WORKDIR /app
COPY . .
RUN pnpm exec prisma generate && pnpm build

########################
# runner — lean standalone server
########################
FROM node:22-bookworm-slim AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs \
  && mkdir -p /app/uploads \
  && chown -R nextjs:nodejs /app
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
