# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install ALL dependencies (including dev)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# ── Stage 2: Runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install ONLY production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy source from builder
COPY --from=builder /app/src ./src

# Switch to non-root user
USER nodeuser

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/healthz || exit 1

# Start server
CMD ["node", "src/index.js"]