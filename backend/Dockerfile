# ====== MonitorPro - Backend API ======
FROM node:18-alpine

WORKDIR /app

# Dépendances (couche cache)
COPY package*.json ./
RUN npm ci --omit=dev

# Code source
COPY . .

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "server.js"]
