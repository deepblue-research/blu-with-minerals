# Stage 1: Build the frontend
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files from root and frontend
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci

# Copy frontend source code
COPY frontend/ ./frontend/

# Build the frontend using Vite
# This will generate the 'dist' folder
RUN npm run build:frontend

# Stage 2: Serve the static files with Nginx
FROM nginx:alpine

# Copy the build output to Nginx's html directory
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy a basic nginx configuration to handle SPA routing if needed
# (Optional: Create an nginx.conf if you need custom routing)
# COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
