# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app

# In an NPM workspace, we need all package files for 'npm ci' to work
COPY package*.json ./
COPY backend/package*.json ./backend/
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
COPY frontend/package*.json ./frontend/

RUN npm ci
COPY backend/ ./backend/
# Generate Prisma Client and build TS
RUN npm run prisma:generate
RUN npm run build:backend

# Stage 3: Production Image
FROM node:20-slim
# Essential for Prisma runtime and network troubleshooting
RUN apt-get update && apt-get install -y openssl ca-certificates netcat-openbsd && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Copy package files for production install
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install only production dependencies
# This includes @prisma/client which was generated in the previous stage
# or will be generated here.
RUN npm ci --omit=dev

# Copy the generated Prisma client from backend-builder
# (Prisma by default puts the client in node_modules/.prisma)
COPY --from=backend-builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend-builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy built backend code and prisma schema
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/prisma ./backend/prisma

# Copy built frontend assets to be served by the backend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose the Cloud Run default port
EXPOSE 8080

# The backend and frontend work in tandem on the same port.
# The backend (Express) serves the frontend (Static Files) and the API.
CMD ["node", "backend/dist/index.js"]
