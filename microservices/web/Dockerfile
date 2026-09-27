FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV API_PROXY=http://gateway:8080
EXPOSE 5181
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5181"]
