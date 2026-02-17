FROM node:lts-buster

# Clone bot from GitHub
RUN git clone https://github.com/vtry813-sketch/test-lite.git /root/inconnu-xd

# Set working directory
WORKDIR /root/inconnu-xd

# Install dependencies
RUN npm install && npm install -g pm2

# Expose port
EXPOSE 9090

# Start the bot
CMD ["npm", "start"]

