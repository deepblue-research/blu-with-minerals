# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app
COPY package*.json ./
COPY frontend/package*.json ./frontend/
RUN npm ci
COPY frontend/ ./frontend/
RUN npm run build:frontend

# Stage 2: Build Backend
FROM node:20-slim AS backend-builder
# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm ci
COPY backend/ ./backend/
# Generate Prisma Client
RUN npm run prisma:generate
# Build the TypeScript project
RUN npm run build:backend

# Stage 3: Production Image
FROM node:20-slim
# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built backend assets and prisma
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/prisma ./backend/prisma
COPY --from=backend-builder /app/node_modules ./node_modules

# Copy built frontend assets to be served by the backend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose the port
EXPOSE 8080

# Command to run the application
# The backend index.js is configured to serve static files from ../../frontend/dist
CMD ["node", "backend/dist/index.js"]
