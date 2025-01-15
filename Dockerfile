# Stage 1: Build Stage
FROM node:20-alpine as builder

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm install --save-dev @nestjs/cli

# Copy the application source code and .env file
COPY . .

# Build the NestJS app
RUN npm run build

# Remove dev dependencies and clean npm cache
RUN npm prune --production && npm cache clean --force

# Stage 2: Production Stage
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/custom* ./

# Copy .env file to the container (optional, if needed for runtime)
COPY .env .env

# Expose the application port
EXPOSE 8080

# Run the application
CMD ["node", "dist/main.js"]
