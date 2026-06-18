FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    sqitch \
    libdbd-pg-perl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY src/ ./src/
COPY tsconfig.json ./
COPY sqitch/ ./sqitch/
COPY sqitch.conf ./
COPY scripts/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 1974

ENTRYPOINT ["./entrypoint.sh"]
