# PostDaily Backend

Production-oriented backend for **PostDaily**, an AI-powered daily social media marketing platform designed for small businesses (cafes, salons, local retail, studios, freelancers).

Built with Node.js, Express, TypeScript (strict mode), PostgreSQL, Prisma ORM, TinyFish website crawling, and NVIDIA NIM (DeepSeek) content generation.

---

## 🛠 Technology Stack

- **Runtime & Framework**: Node.js 18+ / Express.js
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL (conventional with standard relational models, no proprietary vendor SDKs)
- **ORM & Migrations**: Prisma ORM
- **Validation**: Zod (for request payloads, environment variables, and external provider responses)
- **Authentication**: JWT (JSON Web Tokens) with bcrypt password hashing
- **Website Crawling**: [TinyFish](https://tinyfish.ai) API & SDK integration with structured schema validation + Mock provider
- **AI Text Generation**: DeepSeek model hosted on [NVIDIA NIM](https://build.nvidia.com) OpenAI-compatible endpoint + Mock provider
- **Asset Storage**: Independent local filesystem storage adapter (`uploads/assets/`)
- **Testing**: Vitest + Supertest
- **Logging & Security**: Pino structured logging, Helmet security headers, CORS, SSRF protection, and Express rate limiting

---

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ or 20+
- npm 9+
- Docker & Docker Compose (optional, for local PostgreSQL)

### 2. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Key environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5001` | HTTP server port |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/postdaily?schema=public` | PostgreSQL connection string |
| `JWT_SECRET` | *(string)* | Secret key used for signing JWT authentication tokens |
| `TINYFISH_API_KEY` | `""` | TinyFish website crawling API key (leave empty to use mock provider) |
| `NVIDIA_NIM_API_KEY` | `""` | NVIDIA NIM API key for DeepSeek (leave empty to use mock provider) |
| `NVIDIA_NIM_MODEL` | `deepseek-ai/deepseek-r1` | Model identifier on NVIDIA NIM |
| `IMAGE_PROVIDER` | `mock` | Image provider adapter (`mock` generates local card visuals) |

### 3. Start PostgreSQL Database

Using the provided Docker Compose configuration:

```bash
docker compose up -d
```

### 4. Install Dependencies & Run Database Migrations

```bash
# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate

# Apply migrations
npm run prisma:migrate

# Seed the database with sample business data
npm run prisma:seed
```

### 5. Start Development Server

```bash
npm run dev
```

The API will be accessible at: `http://localhost:5001/api/v1`

---

## 🧪 Testing

Run automated tests:

```bash
# Run unit and integration tests
npm test

# Run tests with coverage
npm run test:coverage
```

The test suite runs against built-in mock providers by default, requiring **no paid external API keys**.

---

## 📡 API Endpoints Overview

All endpoints are versioned under `/api/v1` and use consistent JSON response formatting:

```json
{
  "success": true,
  "data": { ... }
}
```

### Health
- `GET /api/v1/health` — Service readiness & provider diagnostics

### Authentication
- `POST /api/v1/auth/register` — Register new user and auto-provision initial business
- `POST /api/v1/auth/login` — Authenticate and receive JWT token
- `GET /api/v1/auth/me` — Current user profile and authorized businesses

### Businesses
- `GET /api/v1/businesses` — List businesses the user owns or belongs to
- `POST /api/v1/businesses` — Create a new business
- `GET /api/v1/businesses/:businessId` — Retrieve business details
- `PATCH /api/v1/businesses/:businessId` — Update business profile
- `DELETE /api/v1/businesses/:businessId` — Delete business (Owner only)

### Website Crawling & Extraction (TinyFish)
- `POST /api/v1/businesses/:businessId/website-crawl` — Trigger automated website crawl
- `GET /api/v1/businesses/:businessId/website-crawl` — Get crawl status & extracted data
- `POST /api/v1/businesses/:businessId/website-crawl/retry` — Retry failed crawl
- `PATCH /api/v1/businesses/:businessId/profile` — Review & confirm extracted profile

### Post Generation (NVIDIA NIM / DeepSeek)
- `POST /api/v1/businesses/:businessId/generations` — Generate today's daily post
- `GET /api/v1/generations/:jobId` — Check generation job progress
- `POST /api/v1/generations/:jobId/retry` — Retry generation job
- `POST /api/v1/posts/:postId/regenerate-caption` — Regenerate caption only
- `POST /api/v1/posts/:postId/regenerate-image` — Regenerate image prompt & visual

### Posts Management
- `GET /api/v1/businesses/:businessId/posts` — Search, filter, and paginate historical posts
- `GET /api/v1/posts/:postId` — Get single post with assets and performance records
- `PATCH /api/v1/posts/:postId` — Edit title, caption, hashtags, CTA, or status
- `POST /api/v1/posts/:postId/archive` — Archive post
- `POST /api/v1/posts/:postId/restore` — Restore archived post
- `DELETE /api/v1/posts/:postId` — Permanently delete post

### Analytics (Data Honesty)
- `GET /api/v1/businesses/:businessId/analytics` — Real observations only (no fake metrics)
- `GET /api/v1/businesses/:businessId/analytics/posts/:postId` — Post metrics snapshots

### Settings
- `GET /api/v1/businesses/:businessId/settings` — Timezone, default platform, preferences
- `PATCH /api/v1/businesses/:businessId/settings` — Update settings

---

## 🛡 Security Highlights

1. **SSRF Prevention**: All crawled URLs are strictly validated. Non-HTTP protocols, private IPv4/IPv6 ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`), loopbacks, link-local, and cloud metadata endpoints (`169.254.169.254`) are systematically blocked before any request is made.
2. **Prompt Injection Defense**: Crawled website copy is treated as untrusted data and isolated inside `<untrusted_website_content>` fences with explicit instructions forbidding the LLM from executing embedded commands.
3. **Data Honesty**: Absent metrics remain strictly `null` (displayed as *"Not recorded"*). The system never generates fake engagement stats.
4. **Token Encryption**: All OAuth access and refresh tokens are stored encrypted at rest using AES-256-GCM. Tokens are never exposed to the frontend or printed in logs.
5. **Approval-First Publishing**: Every AI-generated post enters the `PENDING_APPROVAL` status. Nothing is ever published to LinkedIn or X without explicit per-post user approval.

---

## 🔑 Setting Up Social Developer Applications

### 1. LinkedIn Developer Application Setup

1. Go to the [LinkedIn Developer Portal](https://www.linkedin.com/developers/) and sign in.
2. Click **Create App**:
   - **App Name**: e.g., `PostDaily Social Planner`
   - **LinkedIn Page**: Associate with your company or testing page
   - **App Logo**: Upload an icon
3. In your app dashboard, go to the **Products** tab and request access to:
   - **Sign In with LinkedIn using OpenID Connect** (grants `openid`, `profile`, `email`)
   - **Share on LinkedIn** (grants `w_member_social`)
4. Go to the **Auth** tab:
   - Copy **Client ID** and **Client Secret** into your `.env`:
     ```env
     LINKEDIN_CLIENT_ID=your_linkedin_client_id
     LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
     ```
   - In **Authorized redirect URLs for your app**, add:
     ```text
     http://localhost:5001/api/v1/auth/linkedin/callback
     http://localhost:5001/auth/linkedin/callback
     ```
     *(In production, replace `http://localhost:5001` with your production server URL).*
5. **Scopes Requested**:
   - `openid`: Authenticate user identity
   - `profile`: Retrieve user profile name and unique person URN (`urn:li:person:...`)
   - `w_member_social`: Authorize creating posts and uploading image assets on behalf of the member

---

### 2. X (Twitter) Developer Application Setup

1. Go to the [X Developer Portal](https://developer.x.com/en/portal/dashboard) and sign in.
2. Create a new **Project** & **App** (Free or Basic tier).
3. Under your App's **Settings**, navigate to **User authentication settings** and click **Set up**:
   - **App permissions**: Select **Read and write** (required to post tweets)
   - **Type of App**: Select **Web App, Automated App or Bot**
   - **OAuth 2.0 Settings**:
     - Enable **OAuth 2.0** with **PKCE** (Proof Key for Code Exchange)
     - **Callback URI / Redirect URL**:
       ```text
       http://localhost:5001/api/v1/auth/x/callback
       http://localhost:5001/auth/x/callback
       ```
     - **Website URL**: `http://localhost:5173` (or your production website)
4. Save settings and copy the **OAuth 2.0 Client ID** and **Client Secret**:
   ```env
   X_CLIENT_ID=your_x_client_id
   X_CLIENT_SECRET=your_x_client_secret
   ```
5. **Scopes Requested**:
   - `tweet.read`: Read user tweets to verify author status
   - `tweet.write`: Publish approved tweets and media
   - `users.read`: Fetch user handle to generate post permalinks (`https://twitter.com/{user}/status/{id}`)
   - `offline.access`: Receive refresh tokens for automatic background token renewal

---

### 3. Encryption Key Generation

Generate a 32-byte (64 hex characters) key for AES-256-GCM token encryption:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add the generated key to your `.env`:

```env
TOKEN_ENCRYPTION_KEY=your_generated_64_character_hex_key
REDIRECT_BASE_URL=http://localhost:5001
```

