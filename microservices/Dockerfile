FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY shared ./shared
COPY services ./services
EXPOSE 8080
CMD ["node", "services/gateway/server.js"]
