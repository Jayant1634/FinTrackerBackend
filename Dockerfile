# Use the official Node.js 18 slim image
FROM node:18-slim

# Install necessary packages and MongoDB
USER root

# Install dependencies for adding MongoDB repository
RUN apt-get update && \
    apt-get install -y gnupg wget

# Add MongoDB GPG key
RUN wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -

# Add MongoDB repository
RUN echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/debian bullseye/mongodb-org/6.0 main" > /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB and Supervisor
RUN apt-get update && \
    apt-get install -y mongodb-org supervisor

# Create MongoDB data directory and set ownership
RUN mkdir -p /data/db && \
    chown -R mongodb:mongodb /data/db

# Set environment variables
ENV HOME=/home/node \
    PORT=5000 \
    MONGODB_URI=mongodb://localhost:27017/yourdbname

# Set working directory
WORKDIR $HOME/app

# Copy package files and install dependencies
COPY --chown=node:node package*.json ./
RUN npm install --production

# Copy the application code
COPY --chown=node:node . .

# Create Supervisor configuration
RUN echo "\
[supervisord]\n\
nodaemon=true\n\
\n\
[program:mongod]\n\
command=/usr/bin/mongod --dbpath /data/db --bind_ip_all\n\
autostart=true\n\
autorestart=true\n\
user=mongodb\n\
stdout_logfile=/dev/stdout\n\
stdout_logfile_maxbytes=0\n\
stderr_logfile=/dev/stderr\n\
stderr_logfile_maxbytes=0\n\
\n\
[program:node_app]\n\
directory=/home/node/app\n\
command=node server.js\n\
autostart=true\n\
autorestart=true\n\
user=node\n\
environment=HOME=\"/home/node\",USER=\"node\",PORT=\"5000\",MONGODB_URI=\"mongodb://localhost:27017/yourdbname\"\n\
stdout_logfile=/dev/stdout\n\
stdout_logfile_maxbytes=0\n\
stderr_logfile=/dev/stderr\n\
stderr_logfile_maxbytes=0\n\
" > /etc/supervisor/conf.d/supervisord.conf

# Expose the port your app runs on
EXPOSE 5000

# Start Supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
