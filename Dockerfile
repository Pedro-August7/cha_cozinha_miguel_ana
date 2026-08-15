# ==========================================
# Estágio 1: Build do Front-end (React + Vite)
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ==========================================
# Estágio 2: Runner da Aplicação (Node + Express)
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Instala apenas dependências de produção para deixar a imagem ultra leve
COPY package*.json ./
RUN npm ci --omit=dev

# Copia o build estático do front-end e o servidor backend
COPY --from=builder /app/dist ./dist
COPY server ./server

# Garante a existência da pasta de dados persistentes
RUN mkdir -p /app/server/data

EXPOSE 4000

# O servidor Express serve tanto a API quanto o front-end compilado
CMD ["node", "server/server.js"]
