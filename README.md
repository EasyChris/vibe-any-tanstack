<p align="center">
  <img src="./public/logo.svg" alt="VibeAny" width="80" height="80" />
</p>
<h1 align="center">VibeAny</h1>
<p align="center">
  <a href="./README.zh-CN.md">中文</a> | <a href="./README.md">English</a>
</p>
<p align="center">
  Full-stack starter for building AI-powered web apps with TanStack Start.<br />
  Ships with authentication, database, landing page, blog, docs, i18n, admin panel, and more — ready to deploy in minutes.
</p>
<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/jiahao-jayden/vibe-any-tanstack" alt="License" /></a>
  <a href="https://github.com/jiahao-jayden/vibe-any-tanstack/stargazers"><img src="https://img.shields.io/github/stars/jiahao-jayden/vibe-any-tanstack" alt="Stars" /></a>
  <a href="https://github.com/jiahao-jayden/vibe-any-tanstack/issues"><img src="https://img.shields.io/github/issues/jiahao-jayden/vibe-any-tanstack" alt="Issues" /></a>
  <a href="https://discord.gg/FQ2TAHh6"><img src="https://img.shields.io/badge/Discord-Join-5865F2?logo=discord&logoColor=white" alt="Discord" /></a>
</p>
<p align="center">
  <a href="https://youtu.be/0DqfKBenvkQ">
    <img src="https://img.shields.io/badge/▶_Watch_Demo-black?style=for-the-badge" alt="Watch Demo" />
  </a>
</p>
<p align="center">
  <a href="https://youtu.be/0DqfKBenvkQ">
    <img src="./public/image.png" alt="VibeAny Landing Page" width="800" />
  </a>
</p>

## Features

- **TanStack Start** — File-based routing, SSR, server functions
- **Authentication** — Email/password, Google, GitHub OAuth, magic links (Better Auth)
- **Database** — PostgreSQL with Drizzle ORM, type-safe schema and migrations
- **RBAC** — Role-based access control with permission inheritance
- **Landing Page** — Hero, features, benefits, testimonials, FAQ, CTA sections
- **Blog & Docs** — MDX-powered blog and Fumadocs documentation, multilingual
- **Changelog & Roadmap** — Product changelog timeline and visual roadmap board
- **Admin Panel** — User management, system configuration, role management
- **Internationalization** — English and Chinese out of the box (Intlayer)
- **Email** — Verification and magic link emails via Resend or custom SMTP
- **File Storage** — S3-compatible upload (Cloudflare R2, AWS S3, MinIO)
- **AI Chat** — Chat interface with Vercel AI SDK
- **UI** — Tailwind CSS v4, shadcn/ui, Radix primitives, Lucide icons
- **Theme** — Light / dark / system with one-click toggle

## Architecture

```mermaid
graph TB
    Client([Browser])

    subgraph Frontend
        Router[TanStack Router]
        Query[TanStack Query]
        UI[React 19 + shadcn/ui]
        I18n[Intlayer i18n]
    end

    subgraph Backend["TanStack Start (Vite + Nitro)"]
        API[Server Functions / API Routes]
        Auth[Better Auth]
        Services[Business Logic]
        RBAC[RBAC Middleware]
    end

    subgraph Data
        DB[(PostgreSQL)]
        ORM[Drizzle ORM]
        S3[S3 Storage]
    end

    subgraph Content
        MDX[MDX Blog]
        Docs[Fumadocs]
    end

    subgraph External
        AI[AI Providers]
        Email[Resend / SMTP]
        OAuth[GitHub / Google OAuth]
    end

    Client --> Router
    Router --> Query
    Query --> API
    UI --> Router
    I18n --> UI
    API --> Auth
    API --> Services
    Auth --> RBAC
    Auth --> OAuth
    Services --> ORM
    ORM --> DB
    Services --> S3
    Services --> AI
    Services --> Email
    Router --> MDX
    Router --> Docs
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | TanStack Start + React 19 + Vite |
| Routing | TanStack Router (file-based) |
| Data Fetching | TanStack Query |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Better Auth |
| Styling | Tailwind CSS v4 + shadcn/ui |
| i18n | Intlayer |
| Content | Fumadocs (docs) + MDX (blog) |
| Email | Resend / Nodemailer |
| Validation | Zod |
| Linting | Biome |

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL database

### 1. Clone and install

```bash
git clone https://github.com/jiahao-jayden/vibe-any-tanstack.git
cd vibe-any
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

The app runs in **static mode** with zero configuration — landing page, blog, and docs work without a database. To enable auth and user features, set `DATABASE_URL` and `BETTER_AUTH_SECRET`.

### 3. Set up database (optional)

```bash
pnpm db:push
```

### 4. Start development

```bash
pnpm dev
```

Open [http://localhost:3377](http://localhost:3377).

## Project Structure

```
src/
├── actions/          # Server actions
├── config/           # Site config, i18n content, dynamic config
├── db/               # Drizzle schema (auth, config, RBAC)
├── integrations/     # RBAC checker, storage, TanStack Query
├── routes/
│   ├── api/          # API routes (auth, admin, file upload)
│   └── {-$locale}/   # Page routes with i18n prefix
│       ├── _main/
│       │   ├── _landing/   # Landing pages (home, blog, changelog, etc.)
│       │   ├── admin/      # Admin panel
│       │   └── chat/       # AI chat
│       ├── docs/     # Documentation
│       └── login/    # Login page
├── services/         # Business logic
└── shared/
    ├── components/   # UI components
    ├── context/      # React context (global state)
    ├── hooks/        # Custom hooks
    ├── lib/          # Utilities (auth, email, config, tools)
    ├── middleware/    # Route middleware (auth, locale)
    ├── model/        # Database query functions
    └── types/        # TypeScript types
```

## Configuration

All features are opt-in through environment variables:

| Feature | Required Variables |
|---------|-------------------|
| Database | `DATABASE_URL` |
| Auth | `DATABASE_URL` + `BETTER_AUTH_SECRET` |
| GitHub OAuth | `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` |
| Google OAuth | `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` |
| Email | `EMAIL_PROVIDER` + `EMAIL_FROM` + provider keys |
| Storage | `STORAGE_*` variables |
| Captcha | `VITE_TURNSTILE_*` + `TURNSTILE_SECRET_KEY` |

See [`.env.example`](.env.example) for the full list.

## Scripts

```bash
pnpm dev          # Start dev server on port 3377
pnpm build        # Production build
pnpm preview      # Preview production build
pnpm db:generate  # Generate Drizzle migrations
pnpm db:push      # Push schema to database
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Drizzle Studio
pnpm rbac         # Manage RBAC roles and permissions
pnpm lint         # Lint with Biome
pnpm format       # Format with Biome
pnpm test         # Run tests with Vitest
```

## Deployment

Build and run:

```bash
pnpm build
node .output/server/index.mjs
```

Works with any Node.js hosting — Vercel, Railway, Fly.io, VPS, Docker, etc.

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

## License

[Apache License 2.0](LICENSE)
