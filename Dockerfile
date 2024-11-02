# Dockerfile
# Step 1: Use Node.js as the base image
FROM node:18-alpine

# Step 2: Set the working directory inside the container
WORKDIR /app

# Step 3: Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy the application source code to the container
COPY . .

# Copy .env file to the container
COPY .env .env

# Step 6: Build the NestJS app
RUN npm run build

# Step 7: Expose the port the app runs on (default is 3000)
EXPOSE 3000

# Step 8: Run the application
CMD ["npm", "run", "start:prod"]
