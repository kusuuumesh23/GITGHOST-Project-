# AGENTS.md

Instructions for AI coding agents (Antigravity and others) working in this repository.
Read this file first, then `docs/PRD.md`. If the two ever conflict, `docs/PRD.md` wins on product behavior and this file wins on how to work.

## Project

PostDaily (working title): an AI-powered daily social media marketing platform for small businesses. This repository is the **frontend only**. A Node.js/Express backend (DeepSeek for text, Hugging Face for images, Supabase for storage) will be connected later.

Core idea: the owner generates **one post per day**, reviews and edits it, and keeps a permanent history. The **All Posts** page is the most important page in the product.

## Stack

- React + Vite, TypeScript (strict)
- Tailwind CSS (design tokens live in the Tailwind config)
- lucide-react for all icons
- React Router
- Recharts for charts, date-fns for dates, clsx for class names

Do not add other major dependencies without a stated reason in the task summary.

## Commands

```bash
npm install        # install dependencies
npm run dev        # start dev server
npm run build      # type-check and production build (must pass before finishing any task)
npm run lint       # lint (must pass with no warnings)
npm run test       # run tests, if present
```

## Folder structure

```
src/
  app/            router, providers, app shell
  components/
    ui/           Button, Badge, Input, Select, Modal, Tabs, Menu, Toast, Skeleton, EmptyState
    layout/       Sidebar, MobileNav, BusinessSwitcher, UserMenu, DemoBanner
    posts/        PostCard, PostListItem, PostGrid, PostDetailModal, PostFilters, MetricStat
    charts/       EngagementChart, PlatformComparison, ChartCard
  pages/          Dashboard, CreatePost, AllPosts, Analytics, Profile, Settings
  services/       interfaces, mock/ implementations, http/ implementations, index.ts selector
  data/demo/      demo businesses and posts (isolated, flagged)
  hooks/          usePosts, usePost, useBusiness, useGeneratePost, useAnalytics
  types/          domain types
  lib/            format, clipboard, download, dates, query-params
```

## Architecture rules

1. **Layering:** pages and components call hooks. Hooks call service interfaces. Services have two implementations, `mock` and `http`, chosen by `VITE_DATA_SOURCE` (`mock` or `api`).
2. **No direct data access in UI:** components and pages must never import from `src/data/demo` and must never call `fetch` directly.
3. **Swappable backend:** replacing mock data with the real API must require changes only inside `src/services/`.
4. **Environment variables:** only `VITE_DATA_SOURCE` and `VITE_API_BASE_URL`. Never add API keys, tokens or secrets to frontend code, `.env` files, comments or docs.
5. **URL as state:** All Posts search, filters, sort, and page live in URL query params. The post detail modal lives at `/posts/:id`.

## Data honesty rules (non-negotiable)

- `null` metric means **not recorded**. Display "Not recorded" or a dash. Never treat `null` as `0`. Show `0` only when `0` was recorded.
- Never invent likes, shares, comments, reach, clicks, totals, trends or analytics.
- Totals and charts are computed only from recorded values and say how many posts contributed.
- Demo data lives only in `src/data/demo`, every record has `isDemo: true`, and demo mode shows a visible banner and a "Demo" badge on posts.
- Do not pretend a post was published or that metrics were fetched. Status `published` can only come from the API. Until a real integration exists, the Publish action is disabled with an explanation.
- Generate **today's post only**. Never auto-create 30 posts in advance. One daily post per business per date; do not silently create duplicates.

## Design rules

- Warm off-white background (`#FAF8F4`), white surfaces, charcoal text (`#1F2421`), green accent (`#2F7D5B`). Use the tokens, not ad hoc colors.
- Clean sans-serif (Inter or Geist), generous spacing, 1px subtle borders, soft shadows, border radius 8 to 12px at most.
- Motion limited to 150-200ms transitions on hover, menus and modals. Respect `prefers-reduced-motion`.
- Do not use: purple gradients, emojis as icons, decorative animation, fake statistics, generic AI landing-page styling.
- Status badges: Draft (neutral), Ready to Publish (blue), Published (green), Failed (red).

## Code conventions

- TypeScript strict. No `any` unless justified in a short comment. Prefer explicit domain types from `src/types`.
- Function components and hooks only. Keep components small and reusable; extract when a component exceeds roughly 150 lines or is used twice.
- Name files after their main export (`PostCard.tsx`, `usePosts.ts`). Named exports for components, default exports only for route pages if the router needs them.
- Every async hook exposes `data`, `isLoading`, `error`, and a `retry` or `refetch`.
- Every list or data view has loading (skeleton), error (with retry) and empty states.
- No dead code, commented-out blocks, or leftover `console.log`.
- Dates are stored as ISO strings (`YYYY-MM-DD` for post date) and formatted only at the display edge.

## Accessibility and responsiveness

- All interactive elements are keyboard accessible with visible focus rings. Icon-only buttons have accessible labels.
- Modals and menus trap focus, close on Escape, and restore focus on close.
- Text contrast meets WCAG AA. Charts have a text or table alternative.
- Verify layouts at 375px, 768px, 1024px and 1440px with no horizontal page scroll.

## How to work (phase by phase)

The build plan is in `docs/PRD.md`, section 7 (Phases 0 to 10).

1. Work on **one phase at a time**, only the phase named in the task. Do not start later phases or add features outside scope.
2. Before coding, read the relevant PRD sections and state a short plan.
3. Make the smallest change that satisfies the acceptance criteria. Reuse existing components before creating new ones.
4. When finished, run `npm run build` and `npm run lint`, open the app in the browser, and check the acceptance criteria for the phase, including console errors.
5. End the task with a short summary: what was built, what was verified, what is left or uncertain. Do not claim something works unless you ran it.
6. If a requirement is ambiguous or conflicts with the PRD, stop and ask rather than guessing.

## Definition of done (every task)

- Build and lint pass with zero errors and warnings.
- Zero console errors or warnings in normal use.
- Acceptance criteria for the phase in `docs/PRD.md` verified in the browser.
- No fabricated data, no secrets, no direct demo-data imports in UI code.
- Responsive and keyboard accessible.

## Things not to do

- Do not add authentication, billing, real publishing, or real third-party API calls from the frontend.
- Do not call DeepSeek, Hugging Face or Supabase directly from the browser.
- Do not rewrite the folder structure, rename routes, or change design tokens unless the task says so.
- Do not delete or weaken tests, lint rules or TypeScript strictness to get a build passing.
- Do not commit generated build output, `node_modules`, or `.env` files.

## Routes

| Path | Page |
|---|---|
| `/` | Dashboard |
| `/create` | Create Today's Post |
| `/posts` | All Posts |
| `/posts/:id` | Post detail modal over All Posts |
| `/analytics` | Analytics |
| `/profile` | Business Profile |
| `/settings` | Settings |
