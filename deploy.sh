#!/bin/bash

# Write the SSH private key to a file
echo "$SSH_PRIVATE_KEY" >key.pem

# Set correct permissions for the SSH key file
chmod 600 key.pem

# SSH into the server and deploy the application
echo "Starting deployment on the server..."

# Copy docker-compose.yml to the server
echo "Copying docker-compose.yml to the server..."
scp -i key.pem -o StrictHostKeyChecking=no docker-compose.yml .env $SERVER_USER@$SERVER_IP:/home/hublots/api/

# SSH into the server and execute docker-compose commands
echo "Running docker-compose commands on the server..."
ssh -i key.pem -T -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP <<'EOF'
  # Change to the target directory where docker-compose.yml is located
  mkdir -p /home/hublots/api
  cd /home/hublots/api/

  # Source the .env file to export variables
  if [ -f .env ]; then
    source .env
  else
    echo ".env file not found."
    exit 1
  fi

  # login to gcr.io
  echo "$REGISTRY_PASSWORD" | docker login "$CONTAINER_REGISTRY" -u "$REGISTRY_USERNAME" --password-stdin 

  # Setting the docker image name
  DOCKER_IMAGE=$CONTAINER_REGISTRY/$REGISTRY_USERNAME/hublots-api:latest
  
  # Pull the latest Docker images
  docker compose pull

  # Stop and remove existing containers
  docker rm -f hublots_api

  # Start the containers in detached mode
  docker compose up --wait
EOF

# Capture the exit status of the SSH command
EXIT_STATUS=$?

# Check if the remote script executed successfully
if [ $EXIT_STATUS -ne 0 ]; then
  echo "Deployment failed. Exiting."
  exit $EXIT_STATUS
fi

echo "Deployment completed!"
