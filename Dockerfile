FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=3000

RUN mkdir -p /app/.runtime/media

EXPOSE 3000

CMD ["npm", "start"]
