FROM node:20

WORKDIR /app

# package files eerst (snellere builds)
COPY package*.json ./
RUN npm install

# rest van de code
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
