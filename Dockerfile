FROM node:18-slim

# Install dependencies for MongoDB and other required tools
RUN apt-get update && \
    apt-get install -y wget gnupg && \
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-archive-keyring.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/mongodb-archive-keyring.gpg] https://repo.mongodb.org/apt/debian bullseye/mongodb-org/6.0 main" > /etc/apt/sources.list.d/mongodb-org-6.0.list && \
    apt-get update && \
    apt-get install -y mongodb-org && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Switch to the node user
USER node

# Set environment variables for the user
ENV HOME=/home/node \
    PATH=/home/node/.local/bin:$PATH

# Set the working directory
WORKDIR $HOME/app

# Copy the package.json and package-lock.json files to the working directory
COPY --chown=node:node package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the application code to the working directory
COPY --chown=node:node . .

# Ensure the ownership of the directory to the node user
RUN chown -R node:node .

# Expose the ports the app runs on
EXPOSE 7860 27017

# Create a script to start both Node.js and MongoDB
RUN echo '#!/bin/bash\n\
mongod --fork --logpath /var/log/mongodb/mongod.log --bind_ip_all && \n\
npm start' > start.sh && chmod +x start.sh

# Command to run the combined processes
CMD ["./start.sh"]
