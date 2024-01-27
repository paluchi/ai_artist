# Specify the base image
FROM node:18.17.0

# Set the working directory in the container
WORKDIR /app


# Copy the package.json and package-lock.json files to the container
COPY package.json .

# Install app dependencies
RUN npm install

# Copy the rest of the application's source code
COPY . .

# Change ownership of the app directory to the "node" user
RUN chown -R node:node /app

# Switch to the "node" user
USER node

# The command to run your application
CMD ["npm", "run", "dev"]
