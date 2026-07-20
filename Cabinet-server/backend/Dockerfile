# 1. Usamos la versión 'slim' (Debian) en lugar de 'alpine'
FROM node:18-slim

# 2. Instalamos OpenSSL nativo de Debian
RUN apt-get update -y && apt-get install -y openssl

# 3. Directorio de trabajo
WORKDIR /app

# 4. Copiamos dependencias e instalamos
COPY package*.json ./
RUN npm install

# 5. Copiamos el resto del código (el .dockerignore evitará que pase tu node_modules de Windows)
COPY . .

# 6. Forzamos a Prisma a generar el cliente exacto para este nuevo Linux
RUN npx prisma generate

# 7. Exponemos el puerto
EXPOSE 3000

# 8. Comando para iniciar (ajusta si tu script start es diferente)
CMD ["npm", "start"]