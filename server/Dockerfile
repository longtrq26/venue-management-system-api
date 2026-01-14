# Base image
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies (only production dependencies for smaller image later, but we need devDeps for build)
COPY package*.json ./
# Use strict-ssl false if necessary or just normal install
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose application port
EXPOSE 3001

# Start the application
CMD ["npm", "run", "start:prod"]
