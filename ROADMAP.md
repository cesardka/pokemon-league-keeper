# Pokemon TCG Tournament Manager - Roadmap

This document captures architectural decisions, current implementation status, and planned future work.

---

## Decisions Made

| Decision             | Choice                  | Rationale                                             |
| -------------------- | ----------------------- | ----------------------------------------------------- |
| Framework            | Next.js 15 (App Router) | Latest stable, works well with Vercel deployment      |
| Database             | Vercel Postgres (Neon)  | Native Vercel integration, serverless-friendly        |
| ORM                  | Prisma                  | Type-safe, great DX, works with Vercel Postgres       |
| Barcode Scanner      | html5-qrcode            | Supports both QR codes AND 1D barcodes (future-proof) |
| Real-time Updates    | Polling (2-3s)          | Simpler than WebSockets for MVP                       |
| Authentication       | Event code (PIN-style)  | Simple for MVP, upgradeable to NextAuth later         |
| Judge Identification | Name input on entry     | Stored in session, attached to scanned barcodes       |
| Dev Port             | 1996                    | Pokemon's birth year in Japan 🎮                      |

---

## Current Implementation (MVP)

### ✅ Completed

- **Login page** - Event code input with validation
- **Dashboard** - Role selection (Event Manager / Floor Judge) + event list
- **Event Manager view** - Live barcode feed with:
  - Polling every 2-3 seconds
  - Green flash animation for new barcodes (2s)
  - Live relative timestamps (Xs → Xm → Xh Xm ago)
- **Floor Judge view**:
  - Judge name entry
  - Event selection
  - Camera barcode scanner
  - Confirmation modal before submitting
- **API routes** - Auth, judge name, barcode submission, barcode fetching
- **Database schema** - Store, Event, Round, Participant, Match, Barcode

### Database Schema

```
Store (id, name, location, country, eventCode)
Event (id, storeId, name, game, date, status)
Round (id, eventId, roundNumber)
Participant (id, name, pokemonId, birthDate, category)
Match (id, roundId, participant1Id, participant2Id, winnerId, result)
Barcode (id, eventId, roundId, value, scannedAt, scannedBy)
```

---

## Future Enhancements (Deferred)

### Phase 2: Core Features

- [ ] **Match management** - Participant pairing, recording results
- [ ] **Participant registration** - Add/edit participants
- [ ] **Multiple rounds management** - Create/manage rounds within events
- [ ] **Store management CRUD** - Add/edit stores

### Phase 3: Authentication

- [ ] **Upgrade to NextAuth.js** - Replace event code with proper user accounts
- [ ] **User roles** - Admin, Event Manager, Floor Judge permissions
- [ ] **Per-store user accounts** - Multiple users per store

### Phase 4: UI/UX Enhancements

- [ ] **Pokemon sprite codes** - Display event codes as Pokemon sprites (like Pokemon Go raid codes) instead of alphanumeric characters
- [ ] **Dark mode** - System preference detection
- [ ] **Offline support** - PWA with service worker for offline scanning

### Phase 5: Advanced Features

- [ ] **QR code generation** - Generate QR codes for participants
- [ ] **Export/reporting** - Export tournament data to CSV/PDF
- [ ] **Push notifications** - Notify managers of new scans
- [ ] **Analytics dashboard** - Scan statistics, judge performance

---

## Migration Notes

### Upgrading Authentication (Event Code → NextAuth)

Low risk if done correctly:

1. Auth logic is centralized in `src/lib/auth.ts`
2. Add `User` table, link to stores
3. Replace `getSession()` with NextAuth's `getServerSession()`
4. Update login page to use NextAuth sign-in
5. Existing data (barcodes, events) unaffected - they're tied to stores, not auth

### Switching Barcode Types (1D → QR)

Zero migration needed - `html5-qrcode` already supports both. Just update the scanner config if you want QR-only mode.

---

## Tech Stack Reference

```
├── next@16.2.1          # Framework
├── prisma@7.5.0         # ORM
├── @prisma/client       # Database client
├── @neondatabase/serverless  # Postgres adapter
├── html5-qrcode         # Barcode/QR scanner
├── tailwindcss@4        # Styling
└── typescript@5         # Type safety
```

---

## Quick Reference

| Command          | Description                  |
| ---------------- | ---------------------------- |
| `pnpm dev`       | Start dev server (port 1996) |
| `pnpm build`     | Build for production         |
| `pnpm db:push`   | Push schema to database      |
| `pnpm db:seed`   | Seed sample data             |
| `pnpm db:studio` | Open Prisma Studio           |

**Default event code after seeding:** `1234`
