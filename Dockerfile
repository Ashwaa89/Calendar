FROM node:18-slim

WORKDIR /app

COPY package*.json ./
COPY api ./api
COPY frontend/package*.json ./frontend/

RUN npm install
RUN cd frontend && npm install

COPY frontend ./frontend

RUN cd frontend && npm run build

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["npm", "run", "start:prod"]
