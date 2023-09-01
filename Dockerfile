# Stage 1: Build the Quasar project
FROM node:16 AS build

# Install SSH client
# RUN apt-get update && apt-get install -y openssh-client

# Set working directory
WORKDIR /app

#### YARN PROBLEMS with keychain-sdk
#### Switch to NPM
# # Copy package*.json and yarn.lock
# COPY package*.json ./
# COPY yarn.lock ./

# # Install dependencies
# RUN yarn install

# Copy package*.json and package-lock.json
COPY package*.json ./
COPY package-lock.json ./

# Install dependencies using NPM
RUN npm ci


# Copy the rest of the application code
COPY . .

# Build the Quasar app for production
RUN npx quasar build --mode pwa

# This was added when npx didn't work.
# The correct solution was removing @quasar/app-webpac from package.json
# RUN yarn global add @quasar/cli
# RUN quasar build

# Stage 2: Serve the project using Nginx
FROM nginx:stable

# Copy the built project from the previous stage
COPY --from=build /app/dist/spa /app/dist/spa

# Copy the Nginx configuration file
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Expose the default Nginx port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
