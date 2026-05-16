# Stage 1: Build the Quasar project
ARG NODE_VERSION=24.15.0
ARG PNPM_VERSION=10.33.4
FROM node:${NODE_VERSION} AS build
ARG PNPM_VERSION

# Install SSH client
# RUN apt-get update && apt-get install -y openssh-client

# Set working directory
WORKDIR /app
# Copy dependency manifests and npmrc for registry settings
COPY package.json pnpm-lock.yaml .npmrc ./

# Enable Corepack and activate a pinned pnpm version
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile


# Copy the rest of the application code
COPY . .

# Build the Quasar app for production
RUN pnpm exec quasar build --mode pwa

# Stage 2: Serve the project using Nginx
FROM nginx:stable

# Copy the built project from the previous stage
COPY --from=build /app/dist/pwa /app/dist/pwa

# Copy the Nginx configuration file
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Expose the default Nginx port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
