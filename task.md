# task.md

Phase-by-phase build checklist for PostDaily (working title).

Source documents: `docs/PRD.md` (what to build), `docs/ARCHITECTURE.md` (structure), `AGENTS.md` (how to work).

## How to use this file

- Work **one phase at a time**, in order. Do not start a phase until the previous phase's **Verify** items are all checked.
- Tick a task (`[x]`) only after it is implemented **and** you have run it. Do not tick tasks you have not tested.
- If a task is blocked or changed, add a short note under it instead of deleting it.
- At the end of each phase: run `npm run build` and `npm run lint`, check the browser console, then commit (`phase-N: <summary>`).

Legend: `[ ]` to do, `[x]` done, `[~]` in progress, `[!]` blocked (add a note).

## Progress overview

| Phase | Name | Status |
|---|---|---|
| 0 | Foundation | [ ] |
| 1 | Design system and app shell | [ ] |
| 2 | Types, services and demo data | [ ] |
| 3 | All Posts page | [ ] |
| 4 | Post detail view and edit | [ ] |
| 5 | Create Today's Post | [ ] |
| 6 | Dashboard | [ ] |
| 7 | Analytics | [ ] |
| 8 | Business Profile and Settings | [ ] |
| 9 | Polish, accessibility and QA | [ ] |
| 10 | Backend handoff | [ ] |

---

## Phase 0: Foundation

Goal: a clean, running project skeleton.

- [ ] Create Vite + React + TypeScript project
- [ ] Enable TypeScript `strict` mode
- [ ] Install and configure Tailwind CSS
- [ ] Install `lucide-react`, `react-router-dom`, `recharts`, `date-fns`, `clsx`
- [ ] Add design tokens (colors, radius, shadow, font) to Tailwind config and CSS variables
- [ ] Load the chosen font (Inter or Geist) with a system-font fallback
- [ ] Configure ESLint and Prettier
- [ ] Add lint rule restricting imports (`data/demo` only from `services/mock`; no `fetch` in `pages` or `components`)
- [ ] Create folder structure from `docs/ARCHITECTURE.md` section 4
- [ ] Create `.env.example` with `VITE_DATA_SOURCE=mock` and `VITE_API_BASE_URL=`
- [ ] Add `.gitignore` entries (`node_modules`, `dist`, `.env`)
- [ ] Set up router with placeholder pages for `/`, `/create`, `/posts`, `/posts/:id`, `/analytics`, `/profile`, `/settings`
- [ ] Add `docs/PRD.md`, `docs/ARCHITECTURE.md`, and root `AGENTS.md` and `task.md`
- [ ] Write README with install, run, build, and env instructions

**Verify**
- [ ] `npm run dev` starts and all routes render
- [ ] `npm run build` and `npm run lint` pass
- [ ] No console errors
- [ ] No secrets or keys anywhere in the repo

---

## Phase 1: Design system and app shell

Goal: the layout feels like a real product.

**UI components** (`src/components/ui`)
- [ ] Button (primary, secondary, ghost, danger; sizes; loading state)
- [ ] Badge (neutral, blue, green, red) and `StatusBadge`
- [ ] Input, Textarea, Select, Checkbox
- [ ] Modal (focus trap, Escape to close, labelled title, restores focus)
- [ ] Tabs (keyboard arrow navigation, ARIA roles)
- [ ] Dropdown Menu (keyboard accessible)
- [ ] Toast provider and toast component
- [ ] Skeleton
- [ ] EmptyState (icon, title, description, optional action)
- [ ] ErrorPanel with Retry button

**Layout** (`src/components/layout`)
- [ ] Sidebar fixed on desktop with logo, nav items, business switcher, user menu at bottom
- [ ] Nav items: Dashboard, Create Today's Post, All Posts, Analytics, Business Profile, Settings
- [ ] Active route highlighting
- [ ] Business switcher dropdown (placeholder data until Phase 2)
- [ ] User profile menu (placeholder actions)
- [ ] Mobile navigation (top bar + drawer or bottom nav), usable at 375px
- [ ] DemoBanner shown when `VITE_DATA_SOURCE=mock`
- [ ] PageHeader component (title, description, actions slot)
- [ ] AppShell wiring sidebar, mobile nav, outlet

**Verify**
- [ ] Sidebar is fixed on desktop; mobile nav works at 375px, 768px, 1440px
- [ ] All interactive elements reachable by keyboard with visible focus
- [ ] Modal traps focus and closes on Escape
- [ ] Design matches tokens: warm off-white, white surfaces, charcoal text, green accent, modest radius
- [ ] No emojis used as icons; only Lucide icons

---

## Phase 2: Types, services and demo data

Goal: a backend-ready data layer.

**Types** (`src/types`)
- [ ] `Platform`, `PostStatus`, `PostMetrics`, `Post`
- [ ] `BusinessProfile`
- [ ] `ListPostsParams`, `ListPostsResult`
- [ ] `GenerationRequest`, `GenerationResult`
- [ ] `AnalyticsSummary`, `DateRange`

**Services** (`src/services`)
- [ ] Define `PostsService`, `GenerationService`, `AnalyticsService`, `BusinessService` interfaces
- [ ] `services/index.ts` selecting mock or http from `VITE_DATA_SOURCE`
- [ ] Mock `PostsService.list` with search (caption and topic), platform filter, status filter, date range, sort (newest, oldest, engagement), page and pageSize
- [ ] Mock `get` and `update` with in-memory state
- [ ] Mock `GenerationService` with simulated latency and optional failures, clearly labelled sample output
- [ ] Mock `AnalyticsService` computing from recorded metrics only
- [ ] Mock `BusinessService`
- [ ] HTTP service stubs with `apiClient` wrapper and typed `ApiError` (implemented in Phase 10)

**Demo data** (`src/data/demo`)
- [ ] 2 demo businesses
- [ ] About 28 demo posts across at least 28 consecutive days
- [ ] Mixed platforms and statuses (draft, ready, published, failed)
- [ ] Some posts with `metrics: null` and some with individual `null` fields
- [ ] At least one failed post with `failureReason`
- [ ] Every record has `isDemo: true`
- [ ] Local placeholder images in `public/demo`

**Helpers and hooks**
- [ ] `lib/metrics.ts`: `engagementOf`, `sumRecorded`, `compareByEngagement`, `formatMetric`
- [ ] Hooks: `usePosts`, `usePost`, `useBusiness`, `useGeneratePost`, `useAnalytics` with `data`, `isLoading`, `error`, `refetch`
- [ ] `useUrlState` helper for query-param state
- [ ] `BusinessProvider` with active business persisted in local storage

**Tests**
- [ ] Engagement sorting puts posts with no recorded metrics last
- [ ] `null` is never summed as 0
- [ ] List filtering, sorting and pagination return correct `total` and `hasMore`

**Verify**
- [ ] No component or page imports from `data/demo`
- [ ] Business switcher now uses real (demo) businesses
- [ ] Tests pass; build and lint pass

---

## Phase 3: All Posts page (top priority)

Goal: the complete, scalable post history.

**Page and controls**
- [ ] Page title "All Posts" and total count (shows "Showing X of Y" when filtered)
- [ ] Search by caption or topic, debounced
- [ ] Date range filter
- [ ] Platform filter (multi-select)
- [ ] Status filter (multi-select)
- [ ] Clear all filters action
- [ ] Sort: Newest, Oldest, Engagement
- [ ] Grid and list view toggle, choice persisted
- [ ] Search, filters, sort and page stored in URL query params; restored on refresh

**Post card** (`PostCard`, `PostListItem`)
- [ ] Generated image with fixed aspect ratio, lazy loading and placeholder fallback
- [ ] Caption clamped with "Show more" / "Show less"
- [ ] Platform name and post date
- [ ] Day or date label on every post
- [ ] Likes, shares, comments with icons via `MetricStat`
- [ ] Reach and clicks shown when available
- [ ] "Not recorded" or dash for `null` metrics
- [ ] Status badge (Draft, Ready to Publish, Published, Failed)
- [ ] "Demo" badge when `isDemo`
- [ ] Actions: View Details, Edit, Regenerate, Copy Caption, Download Image (menu on small screens)
- [ ] Copy Caption copies to clipboard with toast confirmation
- [ ] Download Image downloads the file

**Scale and states**
- [ ] Load more with page size 12 and "Showing X of Y"
- [ ] Full history stays accessible (no cap on latest posts)
- [ ] Skeleton loading state
- [ ] Error state with Retry
- [ ] Empty history state with button to Create Today's Post
- [ ] Empty search state with Clear filters

**Verify**
- [ ] All 28 demo posts reachable via Load more
- [ ] Combined search + filters + sort return correct results
- [ ] Refresh keeps filters and sort
- [ ] No invented values; `null` displays correctly
- [ ] Responsive at 375px, 768px, 1024px, 1440px with no horizontal scroll
- [ ] No console errors

---

## Phase 4: Post detail view and edit

Goal: open any post and see everything.

- [ ] `PostDetailModal` on route `/posts/:id` rendered over All Posts (child route)
- [ ] Full image, full caption, hashtags, CTA
- [ ] Platform, date, status
- [ ] Publication details (publish date and link, or "Not published")
- [ ] Failure reason shown for failed posts
- [ ] Metrics panel: likes, shares, comments, reach, clicks, last recorded time
- [ ] Edit mode or dialog for caption, hashtags, CTA, status (draft or ready only)
- [ ] Save updates the list without a page reload
- [ ] Regenerate entry point (links to the Create flow or triggers regeneration)
- [ ] Copy Caption and Download Image actions
- [ ] Previous and next post navigation within the current list
- [ ] Deep link works on refresh; unknown id shows "Post not found" with link back
- [ ] Closing the modal preserves list scroll position and filters

**Verify**
- [ ] Open, close, deep link and edit flows work
- [ ] Modal focus trap, Escape, and labelled title work
- [ ] Unpublished posts never appear as published

---

## Phase 5: Create Today's Post

Goal: the generation workspace.

**Inputs**
- [ ] Business context panel (name, industry, audience, tone, goals) with link to Business Profile
- [ ] Platform selection
- [ ] Post objective selection
- [ ] Tone selection
- [ ] "Generate Post" button

**Generation behavior**
- [ ] Generates today's post only
- [ ] If today's post exists, load it and offer Regenerate (no silent duplicate)
- [ ] Separate loading states for caption and image
- [ ] Error message with Retry; a failed image does not discard a good caption (and vice versa)
- [ ] Demo notice that mock output is sample content

**Editor**
- [ ] Image preview area
- [ ] Editable caption, hashtags, CTA
- [ ] Visual prompt field
- [ ] Regenerate caption
- [ ] Regenerate image
- [ ] Copy caption
- [ ] Download image
- [ ] Save as draft and Mark as ready
- [ ] Publish button disabled with explanation ("Connect a social account to publish")

**Preview**
- [ ] Platform-style previews: Instagram, Facebook, LinkedIn, X
- [ ] Preview updates live as fields are edited

**Verify**
- [ ] Simulated failure shows error and Retry
- [ ] Saved post appears at the top of All Posts
- [ ] Second generation on the same day does not create a duplicate
- [ ] No real API calls or keys anywhere

---

## Phase 6: Dashboard

Goal: a useful daily home screen.

- [ ] Personalized welcome message (user and business)
- [ ] Today's generation status (not generated, draft, ready, published, failed)
- [ ] Prominent "Generate Today's Post" button (or "Review Today's Post" when it exists)
- [ ] Preview of today's post when present
- [ ] Recent posts (4 to 6) with link to All Posts
- [ ] Compact totals: posts, likes, shares, comments, from recorded data only
- [ ] Dash shown when nothing is recorded
- [ ] Engagement trend chart only when at least 3 posts have recorded metrics
- [ ] Explanatory empty state for chart, recent posts, and today's post

**Verify**
- [ ] Empty dataset: every widget shows an empty state and no numbers
- [ ] Demo dataset: totals match recorded values only
- [ ] Chart hidden when fewer than 3 posts have metrics

---

## Phase 7: Analytics

Goal: honest performance insight.

- [ ] Date-range filter (7, 30, 90 days, custom), range in URL query params
- [ ] Engagement trend over time
- [ ] Metric selector or tabs: likes, shares, comments, reach, clicks
- [ ] Top-performing posts list linking to post detail
- [ ] Platform-wise comparison chart
- [ ] Summary figures with "based on N posts with recorded metrics"
- [ ] Empty state when data is insufficient
- [ ] Text or table alternative for each chart

**Verify**
- [ ] Charts respond to the date range
- [ ] Posts without metrics are excluded and counted in a note
- [ ] Layout works at 375px

---

## Phase 8: Business Profile and Settings

Goal: the context that drives generation.

**Business Profile**
- [ ] Editable form: business name, industry, description, location
- [ ] Target audience, marketing goals, preferred platforms
- [ ] Brand tone and content preferences
- [ ] Validation with clear error messages
- [ ] Unsaved-changes warning
- [ ] Save confirmation toast
- [ ] Changes reflected in the sidebar switcher and Create Today's Post context panel

**Settings**
- [ ] Sections or tabs: Account, Appearance, Notifications
- [ ] Account: name and email form
- [ ] Appearance: light, dark, system theme (working, no flash on load)
- [ ] Notifications: daily reminder toggle and time, email preferences
- [ ] Settings persisted locally in mock mode and labelled as local

**Verify**
- [ ] Forms fully keyboard accessible
- [ ] Theme switch works across all pages
- [ ] Profile edits flow through to the Create page

---

## Phase 9: Polish, accessibility and QA

Goal: release-quality frontend.

- [ ] Responsive pass on every page at 375px, 768px, 1024px, 1440px
- [ ] Accessibility pass: labels, roles, focus order, contrast (WCAG AA), reduced motion
- [ ] Charts have accessible text alternatives
- [ ] Lazy-load route pages; confirm charts library loads only where used
- [ ] Memoize `PostCard` and check Load more does not re-render earlier cards
- [ ] Add route-level error boundary
- [ ] Consistent loading, error and empty states across all pages
- [ ] Remove unused code, dead files and leftover `console.log`
- [ ] Confirm no fabricated data anywhere (search for hard-coded numbers in components)
- [ ] Confirm no secrets in the repo
- [ ] Update README

**Verify (release checklist)**
- [ ] All six sections work, including deep links and back/forward
- [ ] All Posts: search, three filters, three sorts, grid and list, Show more, Load more, detail modal, five card actions
- [ ] All 28 demo posts reachable
- [ ] Create Today's Post: loading, error, retry, independent regeneration, live previews
- [ ] Dashboard and Analytics empty states verified
- [ ] `npm run build` and `npm run lint` pass with no warnings
- [ ] Zero console errors or warnings in normal use

---

## Phase 10: Backend handoff

Goal: make the later integration a swap, not a rewrite.

- [ ] Implement `services/http/*` against the contract in `docs/PRD.md` section 9
- [ ] `apiClient` using `VITE_API_BASE_URL`
- [ ] Map HTTP errors to typed `ApiError` and show specific messages in the UI
- [ ] Auth header hook (token provider, no secrets)
- [ ] Write `docs/API_CONTRACT.md` with request and response shapes and `null` metric semantics
- [ ] Short guide for connecting Express, DeepSeek, Hugging Face and Supabase (server-side only)
- [ ] Confirm status `published` and metrics only come from the API

**Verify**
- [ ] Setting `VITE_DATA_SOURCE=api` is the only change needed to use the backend
- [ ] No page, component or hook changes required
- [ ] No third-party AI or database is called from the browser

---

## Backlog (not in scope for this release)

- [ ] Real authentication
- [ ] Real publishing to social platforms
- [ ] Real metric syncing from social platforms
- [ ] Post version history for regenerated content
- [ ] Multi-platform variants of the same daily post
- [ ] List virtualization for very large histories
- [ ] Team accounts and roles
