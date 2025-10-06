# server/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY smpp-server.js ./

EXPOSE 2775

CMD ["node", "smpp-server.js"]