# Gunakan base image untuk Node.js
FROM node:18-alpine AS builder

# Set working directory di dalam container
WORKDIR /app

# Copy package.json dan pnpm-lock.yaml untuk menginstal dependencies terlebih dahulu
COPY fe-propeng/package.json fe-propeng/pnpm-lock.yaml ./

# Install pnpm & dependencies
RUN npm install -g pnpm && pnpm install

# Copy seluruh file proyek ke dalam container
COPY . .

# Build Next.js
RUN pnpm run build

# Gunakan image yang lebih kecil untuk runtime
FROM node:18-alpine AS runner

# Set working directory
WORKDIR /app

# Copy hasil build dari tahap builder
COPY --from=builder /app ./

# Jalankan server Next.js
CMD ["pnpm", "start"]
