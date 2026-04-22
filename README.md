- [Pokemon TCG Tournament Manager](#pokemon-tcg-tournament-manager)
  - [Features](#features)
  - [Tech Stack](#tech-stack)
  - [Art Resources](#art-resources)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Local Setup](#local-setup)
    - [Database Management](#database-management)
    - [Default Event Code](#default-event-code)
  - [Project Structure](#project-structure)
  - [Deployment](#deployment)
  - [Updating the Remote Database](#updating-the-remote-database)
    - [1. Grab the remote connection string](#1-grab-the-remote-connection-string)
    - [2. Make sure your migrations are committed](#2-make-sure-your-migrations-are-committed)
    - [3. Apply the migrations to the remote DB](#3-apply-the-migrations-to-the-remote-db)
    - [4. (Optional) Seed the remote DB](#4-optional-seed-the-remote-db)
    - [5. (Destructive) Fully reset the remote DB](#5-destructive-fully-reset-the-remote-db)
    - [Troubleshooting](#troubleshooting)
  - [Roadmap](#roadmap)

# Pokemon TCG Tournament Manager

A web application for managing local Pokemon TCG tournaments with mobile barcode scanning.

## Features

- **Event Code Authentication** - Simple PIN-based access for tournament staff
- **Event Manager View** - Real-time dashboard showing scanned barcodes as they come in
- **Floor Judge View** - Mobile-friendly barcode scanner using device camera
- **Live Updates** - Barcodes appear with green flash animation, timestamps update in real-time

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL (Vercel Postgres / Neon)
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Barcode Scanner**: html5-qrcode

## Art Resources

- [Pokemon Archive Assets](https://www.pokeos.com/archive/assets)
- [Pokemon Hi-Res Item Icons](https://drive.google.com/drive/folders/1rPpIzyWRidSKoAwQyWwiVg9hTyjU-8r3)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Docker (for local PostgreSQL)

### Local Setup

1. **Clone and install dependencies**

   ```bash
   git clone <repo-url>
   cd creed
   pnpm install
   ```

2. **Start local PostgreSQL with Docker**

   ```bash
   docker compose up -d
   ```

   This starts PostgreSQL on port `5433` (to avoid conflicts with other projects).

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   The default `.env` should work out of the box for local development:

   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/creed"
   ```

4. **Generate Prisma client**

   ```bash
   npx prisma generate
   ```

5. **Push database schema**

   ```bash
   pnpm db:push
   ```

6. **Seed sample data** (optional)

   ```bash
   pnpm db:seed
   ```

7. **Run development server**

   ```bash
   pnpm dev
   ```

8. Open [http://localhost:1996](http://localhost:1996)

### Database Management

| Command                  | Description                            |
| ------------------------ | -------------------------------------- |
| `docker compose up -d`   | Start PostgreSQL                       |
| `docker compose down`    | Stop PostgreSQL                        |
| `pnpm db:push`           | Push schema changes                    |
| `pnpm db:seed`           | Seed sample data                       |
| `pnpm db:studio`         | Open Prisma Studio                     |
| `pnpm db:migrate:dev`    | Create + apply a new migration (dev)   |
| `pnpm db:migrate:deploy` | Apply pending migrations (prod/remote) |

**TablePlus / GUI Connection:**

| Field    | Value       |
| -------- | ----------- |
| Host     | `localhost` |
| Port     | `5433`      |
| User     | `postgres`  |
| Password | `postgres`  |
| Database | `creed`     |

### Default Event Code

After seeding, use event code: `1234`

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   ├── dashboard/     # Role selection page
│   ├── manager/       # Event manager views
│   └── judge/         # Floor judge views
├── components/        # React components
└── lib/               # Utilities (auth, prisma, types)
```

## Deployment

Deploy to Vercel:

1. Push your code to GitHub
2. Import project in Vercel
3. Add a Postgres database from Vercel Storage
4. Deploy

The `DATABASE_URL` will be automatically configured.

## Updating the Remote Database

Use this whenever you've changed `prisma/schema.prisma` and/or want to
re-seed the shared/remote database (Neon, Vercel Postgres, etc.).

> **Never commit your remote `DATABASE_URL`.** Pass it inline to the
> commands below, or keep it in an untracked `.env.production` file.

### 1. Grab the remote connection string

- **Neon**: copy the **pooled** connection string (it contains
  `-pooler`) from the Neon dashboard.
- **Vercel Postgres**: Project → Storage → your DB → `.env.local` tab,
  copy `DATABASE_URL`.

Keep it handy as `<REMOTE_URL>` below. On Neon it should look like:

```
postgresql://<user>:<password>@<project>-pooler.<region>.aws.neon.tech/<db>?sslmode=require
```

### 2. Make sure your migrations are committed

Locally, every schema change must first be captured as a migration:

```bash
pnpm db:migrate:dev --name <short_description>
git add prisma/schema.prisma prisma/migrations
git commit -m "db: <short_description>"
```

### 3. Apply the migrations to the remote DB

```bash
DATABASE_URL="<REMOTE_URL>" pnpm db:migrate:deploy
```

This applies every pending migration found in `prisma/migrations/` to
the remote DB. It is idempotent — running it again is a no-op.

### 4. (Optional) Seed the remote DB

The seed in `prisma/seed.ts` is idempotent — existing rows are not
duplicated, and the 1000-row load-test event is only created if it
doesn't already exist.

```bash
NODE_ENV=development \
DATABASE_URL="<REMOTE_URL>" \
pnpm db:seed
```

> The seed short-circuits when `NODE_ENV=production`, so explicitly set
> `NODE_ENV=development` if your shell already exports production.

### 5. (Destructive) Fully reset the remote DB

Only do this on staging/dev DBs — **it drops every table**:

```bash
DATABASE_URL="<REMOTE_URL>" pnpm prisma migrate reset --force
# then re-seed if the reset didn't run the seed automatically:
NODE_ENV=development DATABASE_URL="<REMOTE_URL>" pnpm db:seed
```

### Troubleshooting

- **`The table public.Xyz does not exist`** after a migration — the
  generated Prisma client is stale. Run:
  ```bash
  rm -rf node_modules/.prisma node_modules/@prisma/client
  pnpm install && pnpm prisma generate
  ```
- **Neon connection hangs / errors** — make sure you're using the
  **pooled** connection string (contains `-pooler`). The seed and
  client auto-detect Neon and use the serverless driver.
- **Seed says "Load-test event already has 1000 barcodes, skipping"**
  and you want fresh values — delete the existing load-test rows first:
  ```sql
  DELETE FROM "barcode" WHERE "eventId" = 'load-test-event-1k';
  ```
  Then re-run the seed.

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for architectural decisions, future plans, and migration notes.
