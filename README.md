# PostDaily (Frontend)

PostDaily is an AI-powered daily social media marketing platform designed for small businesses (cafes, salons, local retail, studios, freelancers). It empowers business owners to generate one high-quality, on-brand post each day, review and customize it, and maintain a permanent, searchable historical record.

This repository contains the **frontend client** built with React, Vite, TypeScript, and Tailwind CSS. It is backend-ready to connect to a Node.js/Express API (with DeepSeek, Hugging Face, and Supabase).

---

## 🛠 Stack

- **Framework**: React 18 + Vite
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **Icons**: [lucide-react](https://lucide.dev/) (no emojis as icons)
- **Routing**: React Router v6
- **Charts**: Recharts
- **Utilities**: `clsx`, `date-fns`
- **Quality**: ESLint with architectural import boundaries + Prettier

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or 20+
- npm 9+

### 1. Installation

```bash
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Available variables:

| Variable | Default | Description |
|---|---|---|
| `VITE_DATA_SOURCE` | `mock` | Data source provider: `mock` (in-memory demo dataset) or `api` (Express backend) |
| `VITE_API_BASE_URL` | `""` | Base URL of the backend API (used when `VITE_DATA_SOURCE=api`) |

> **Security Rule**: Never add third-party AI keys, database tokens, or secrets to this frontend repository or `.env` files. All external AI calls (DeepSeek, Hugging Face) and database access (Supabase) are handled strictly server-side.

### 3. Running Locally

Start the Vite development server:

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Production Build & Linting

```bash
# Type-check and production bundle build
npm run build

# Run ESLint with zero allowed warnings
npm run lint

# Format code with Prettier
npm run format
```

---

## 🧭 Routes

| Path | Page | Description |
|---|---|---|
| `/` | Dashboard | Today's generation status, recent posts, and metric totals |
| `/create` | Create Today's Post | Daily AI generation workspace and live platform preview |
| `/posts` | All Posts | Complete historical archive with filters, search, and sort |
| `/posts/:id` | Post Detail Modal | Deep-linkable modal view over All Posts preserving list state |
| `/analytics` | Analytics | Honest performance trends and platform comparisons |
| `/profile` | Business Profile | Business context, target audience, brand tone, and preferences |
| `/settings` | Settings | Account preferences, appearance (light/dark theme), and reminders |

---

## 🏛 Architecture & Data Honesty Rules

1. **Layering**:
   - `pages` and `components` invoke custom hooks.
   - `hooks` call service interfaces.
   - `services` provide `mock` and `http` implementations selected via `VITE_DATA_SOURCE`.
   - UI components and pages never import `src/data/demo` or call `fetch` directly (enforced via ESLint).
2. **Data Honesty**:
   - `null` metric means **not recorded** (displayed as "Not recorded" or a dash).
   - Never invent or fabricate likes, shares, comments, reach, or analytics.
   - Status `published` is only set after confirmation from a real publishing integration.
   - One daily post per business per date.
3. **Design Tokens**:
   - Warm off-white background (`#FAF8F4`), white surfaces (`#FFFFFF`), charcoal text (`#1F2421`), and natural green accent (`#2F7D5B`).
   - Clean sans-serif typography (Inter) with accessible contrast (WCAG AA).
