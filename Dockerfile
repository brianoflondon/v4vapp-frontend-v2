# Stage 1: Build the Quasar project
FROM node:16 AS build

# Set working directory
WORKDIR /app

# Copy package*.json and yarn.lock
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
RUN yarn install

# Copy the rest of the application code
COPY . .

# Build the Quasar app for production
RUN npx quasar build

# Stage 2: Serve the project using Nginx
FROM nginx:stable

# Copy the built project from the previous stage
COPY --from=build /app/dist/spa /app/dist/spa

# Copy the Nginx configuration file
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Expose the default Nginx port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
