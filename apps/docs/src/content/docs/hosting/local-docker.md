---
title: Local And Docker
description: How to run DPG locally with Docker-backed PostgreSQL and Redis.
head: []
---

This is the recommended development setup.

## Why This Mode

Use this when:

- you are developing the API
- you are writing or testing schemas
- you want predictable local Postgres and Redis

## Start The Backing Services

```bash
docker compose up -d db redis
```

## Example Local Environment

```bash
INSTANCE_NAME="dpg-local"
INSTANCE_ENV="development"
API_DOMAIN="http://localhost"
API_PORT="2742"
AUTH_SECRET="replace-this"
ALLOWED_ORIGINS="http://localhost:3000"
SERVED_DOMAINS="yellow_dot/student"
NETWORK_CONFIG_SOURCE="local"
NETWORK_CONFIG_LOCAL_FILE="examples/schemas/yellow_dot/network.json"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="replace-this"
POSTGRES_DB="postgresdb"
POSTGRES_HOST="127.0.0.1"
POSTGRES_PORT="5432"
DATABASE_PORT="5432"
REDIS_HOST="127.0.0.1"
REDIS_PASSWORD="replace-this"
REDIS_PORT="5555"
```

## Run The API

```bash
pnpm dev:api
```

## Build And Run The API Image

The API also ships with a production Dockerfile at `apps/api/Dockerfile`.

Build the image from the repository root:

```bash
docker build -f apps/api/Dockerfile -t dpg-api .
```

Run it with the local environment:

```bash
docker run --env-file .env -p 2742:2742 dpg-api
```

When running the API as a container, `127.0.0.1` inside the container is not your host machine. Point `POSTGRES_URL` and `REDIS_URL` at reachable hosts, or run the API container on the same Docker network as the `db` and `redis` services.

## Useful Checks

- `GET /`
- `/api/reference`
- `GET /api/v1/item/fetch`
- `GET /api/v1/network/item/fetch`
