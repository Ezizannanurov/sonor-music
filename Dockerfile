FROM node:20-bookworm-slim

# Install system dependencies: python3, ffmpeg, curl, and latest yt-dlp
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    ffmpeg \
    curl \
    ca-certificates \
 && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
 && chmod a+rx /usr/local/bin/yt-dlp \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

ENV PORT=10000
EXPOSE 10000

# Start on 0.0.0.0:$PORT
CMD ["npx", "next", "start", "-p", "10000", "-H", "0.0.0.0"]
