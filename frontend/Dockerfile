# ====== MonitorPro - Frontend (build React puis service nginx) ======
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# URLs API/WS injectées au build. Par défaut : même domaine (proxy nginx).
ARG REACT_APP_API_URL=/api
ARG REACT_APP_WS_URL=
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_WS_URL=$REACT_APP_WS_URL

RUN npm run build

# ---- Service statique + proxy ----
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
