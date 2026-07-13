# Build Stage
FROM node:22-alpine AS build

WORKDIR /app

# Copy dependency mappings and install packages
COPY package*.json ./
RUN npm ci

# Copy sources and build static production bundle
COPY . .
RUN npm run build

# Serve Stage
FROM nginx:alpine

# Copy compilation static bundle to Nginx standard serving folder
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration to support SPA routing redirection if required
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $$uri $$uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose web port
EXPOSE 80

# Start server
CMD ["nginx", "-g", "daemon off;"]
