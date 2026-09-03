# VIDYORA

Production-grade multi-vendor e-commerce marketplace built with Next.js, PostgreSQL, and Prisma.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js Server Actions, Route Handlers, PostgreSQL, Prisma
- **Auth:** Auth.js (NextAuth v5) with RBAC

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update DATABASE_URL and AUTH_SECRET in .env

# Push schema to database
npm run db:push

# Seed sample data
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Seed Credentials

Password for all seed users: `Password@123`

| Role     | Email                  |
|----------|------------------------|
| Admin    | admin@vidyora.com      |
| Seller 1 | seller1@vidyora.com    |
| Seller 2 | seller2@vidyora.com    |
| Customer | customer1@example.com  |

## Scripts

| Command           | Description              |
|-------------------|--------------------------|
| `npm run dev`     | Start dev server         |
| `npm run build`   | Production build         |
| `npm run typecheck` | TypeScript check       |
| `npm run lint`    | ESLint                   |
| `npm run db:push` | Push Prisma schema       |
| `npm run db:seed` | Seed database            |
| `npm run db:studio` | Prisma Studio          |

## Project Structure

```
app/
├── (storefront)/   # Customer-facing pages
├── seller/         # Seller Central
├── admin/          # Admin Panel
└── api/            # Route handlers

lib/                # Core utilities & services
prisma/             # Database schema & seed
actions/            # Server Actions (Phase 3+)
components/         # React components
types/              # TypeScript types
```

## Implementation Phases

- [x] **Phase 1:** Project setup, schema, seed, folder structure
- [x] **Phase 2:** Database migrations
- [x] **Phase 3:** Authentication & RBAC
- [x] **Phase 4:** Storefront (homepage, products, search, PDP)
- [ ] **Phase 5:** Cart & Checkout
- [ ] **Phase 6:** Orders & tracking
- [ ] **Phase 7:** Seller Central
- [ ] **Phase 8:** Admin Panel
- [ ] **Phase 9:** Reviews
- [ ] **Phase 10:** SEO, performance, security

## License

Private — All rights reserved.
