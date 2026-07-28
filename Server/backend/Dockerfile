ARG BUN_VERSION=1.1.0

FROM oven/bun:${BUN_VERSION}-slim

RUN apt-get update -y && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN groupadd -g 1001 bunapp && \
    useradd -u 1001 -g bunapp -s /bin/bash -m bunapp

COPY package*.json bun.lock* ./
COPY prisma ./prisma/

RUN chown -R bunapp:bunapp /app

USER bunapp

RUN bun install

COPY --chown=bunapp:bunapp . .

RUN bunx prisma generate

EXPOSE 3000

CMD ["bun", "run", "start"]
