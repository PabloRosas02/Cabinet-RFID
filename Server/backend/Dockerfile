FROM node:20-slim
RUN apt-get update -y && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/ ./

RUN npx prisma generate

RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/bash -m nodejs && \
    chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

CMD ["npm", "start"]
