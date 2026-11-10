# Production frontend: build with Node.js, serve with non-root NGINX.
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# Public routing values only; VITE_* are embedded in the browser bundle.
ENV VITE_AUTH_API_URL=/auth-api \
    VITE_USERS_API_URL=/users-api
RUN npm run build

FROM nginx/nginx-unprivileged:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/ /usr/share/nginx/html/
EXPOSE 8080
