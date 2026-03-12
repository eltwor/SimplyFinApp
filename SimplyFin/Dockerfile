# ═══ ETAP 1: Budowanie aplikacji React ═══
FROM node:20-alpine AS builder

WORKDIR /app

# Kopiujemy package.json i instalujemy zależności
COPY package*.json ./
RUN npm ci

# Kopiujemy cały kod
COPY . .

# Budujemy aplikację (tworzy katalog /app/dist)
RUN npm run build

# ═══ ETAP 2: Serwowanie plików z nginx ═══
# Bierzemy lekki nginx image
FROM nginx:alpine

# Kopiujemy wybudowane pliki z etapu 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Kopiujemy konfigurację nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]