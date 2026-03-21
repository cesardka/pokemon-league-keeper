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

| Command                | Description         |
| ---------------------- | ------------------- |
| `docker compose up -d` | Start PostgreSQL    |
| `docker compose down`  | Stop PostgreSQL     |
| `pnpm db:push`         | Push schema changes |
| `pnpm db:seed`         | Seed sample data    |
| `pnpm db:studio`       | Open Prisma Studio  |

**TablePlus / GUI Connection:**
| Field | Value |
|-------|-------|
| Host | `localhost` |
| Port | `5433` |
| User | `postgres` |
| Password | `postgres` |
| Database | `creed` |

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

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for architectural decisions, future plans, and migration notes.
