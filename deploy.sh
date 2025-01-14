#!/bin/bash

# Write the SSH private key to a file
echo "$SSH_PRIVATE_KEY" > key.pem

# Set correct permissions for the SSH key file
chmod 600 key.pem

# SSH into the server and deploy the application
echo "Starting deployment on the server..."

# Copy docker-compose.yml to the server
echo "Copying docker-compose.yml to the server..."
scp -i key.pem -o StrictHostKeyChecking=no docker-compose.yml .env $SERVER_USER@$SERVER_IP:/home/hublots/api/

# SSH into the server and execute docker-compose commands
echo "Running docker-compose commands on the server..."
ssh -i key.pem -T -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOF'
  # Change to the target directory where docker-compose.yml is located
  mkdir -p /home/hublots/api
  cd /home/hublots/api/

  # Pull the latest Docker images
  docker compose pull

  # Stop and remove existing containers
  docker compose down

  # Start the containers in detached mode
  docker compose up -d
EOF

echo "Deployment completed!"
