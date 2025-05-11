FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (including development)
RUN npm config set registry https://registry.npmjs.org/
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies including dev since the built code may reference them
RUN npm config set registry https://registry.npmjs.org/
RUN npm ci

# Copy built app from builder stage
COPY --from=builder /app/dist ./dist

# Copy drizzle migrations
COPY drizzle/ ./drizzle/

# Environment variables
ENV NODE_ENV=production

# Install postgresql-client and curl for health checks
RUN apk add --no-cache postgresql-client curl

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:5005/health || exit 1

# Expose the application port
EXPOSE 5005

# Start the application
CMD ["node", "dist/index.js"]
