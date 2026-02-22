# ============================================================================
# Tuned API - Multi-stage Docker Build
# Target: Azure Container Apps
# ============================================================================

# ---------- Build stage ----------
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Compile TypeScript
RUN npm run build

# ---------- Production stage ----------
FROM node:20-alpine AS production

WORKDIR /app

# Add non-root user for security
RUN addgroup -S tuned && adduser -S tuned -G tuned

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --production && npm cache clean --force

# Copy compiled JavaScript from build stage
COPY --from=build /app/dist ./dist

# Set ownership
RUN chown -R tuned:tuned /app

USER tuned

# Expose the API port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the server
CMD ["node", "dist/server.js"]
