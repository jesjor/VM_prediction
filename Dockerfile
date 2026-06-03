FROM node:22-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ .
COPY --from=client-build /app/client/dist ./public

EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "src/index.js"]
