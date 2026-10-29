# ChatFlow — Modern WhatsApp Business CRM & Automation SaaS

> **“Turn Every Conversation Into Growth.”**  
> Powerful business communication. Simple automation. Pricing every small business can afford.

ChatFlow is a full-stack, multi-tenant WhatsApp CRM and business automation SaaS platform tailored for Indian small and medium businesses (retail shops, coaching centres, salons, restaurants, real estate and local e-commerce).

---

## Architecture & Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend (`frontend/`)** | Next.js 15 (App Router, JavaScript only), React 19, CSS Modules + CSS Variables, Framer Motion, Lucide React, Recharts, React Hook Form + Zod |
| **Backend (`backend/`)** | Node.js, Express.js (JavaScript only), REST API (`/api/v1`), Socket.IO, JWT in `httpOnly` cookies (`cf_session`), bcryptjs, express-rate-limit, Helmet, Zod |
| **Database** | MySQL 8, Sequelize v6 ORM (25 migrations, models, associations, seeders, strict `businessId` tenant isolation) |
| **Queues & Real-time** | BullMQ + Redis (with automatic in-process fallback when `REDIS_URL` is not configured), Socket.IO |
| **Messaging & AI** | Official WhatsApp Business Platform (Cloud API) provider abstraction (`WhatsAppCloudProvider` + `DemoProvider`), OpenAI-compatible AI Assistant adapter with usage limits |

---

## 1. Prerequisites

- **Node.js** 20+ (tested on Node 22 / 26) and **npm** 10+
- **MySQL 8.0+** (or **Docker & Docker Compose** to spin up MySQL 8 and Redis locally)
- **Redis 7+** *(optional in development — background jobs fall back to an in-process queue when `REDIS_URL` is omitted)*

---

## 2. Installation Steps

Clone the repository and install dependencies for both `frontend` and `backend`:

```bash
# 1. Install Frontend dependencies
cd frontend
npm install

# 2. Install Backend dependencies
cd ../backend
npm install
```

---

## 3. Environment Setup

Copy the example environment files in both directories:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### Key Backend Variables (`backend/.env`)

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=chatflow
DB_USER=chatflow_user
DB_PASSWORD=your_mysql_password

# Generate 32+ character random strings in production:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
AUTH_SECRET=
PASSWORD_RESET_SECRET=
CREDENTIALS_ENCRYPTION_KEY=

# Official WhatsApp Business Platform (Cloud API)
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=

# Optional Redis & Email & AI
REDIS_URL=
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASSWORD=
AI_PROVIDER=
AI_API_KEY=
```

### Key Frontend Variables (`frontend/.env.local`)

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
```

> **Central Brand & Pricing Configuration:**  
> - Brand name (`ChatFlow`), tagline, navigation, and social URLs live in [`frontend/lib/site.js`](frontend/lib/site.js).  
> - Plan prices (`Free ₹0`, `Starter ₹199`, `Growth ₹499`, `Pro ₹999`, `Business`) live in [`frontend/lib/pricing.js`](frontend/lib/pricing.js) and the backend plans seeder.

---

## 4. MySQL Database Creation

If running MySQL 8 locally without Docker, create the database and user:

```sql
CREATE DATABASE IF NOT EXISTS chatflow
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'chatflow_user'@'localhost' IDENTIFIED BY 'your_mysql_password';
GRANT ALL PRIVILEGES ON chatflow.* TO 'chatflow_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## 5. Sequelize Migration Commands

From `backend/`:

```bash
cd backend

# Run all 25 migrations
npm run db:migrate

# Undo the most recent migration
npm run db:migrate:undo
```

---

## 6. Seed Command

Seed the subscription plans (`Free`, `Starter`, `Growth`, `Pro`, `Business`) and, in development, the sample demo workspace (**Sharma Fashion House (Demo)**):

```bash
cd backend
npm run db:seed
```

To reset and re-seed from scratch in development:

```bash
cd backend
npm run db:reset
```

### Demo Workspace Credentials (Development Only)

- **Email:** `demo@chatflow.local`
- **Password:** `Demo@12345`

---

## 7. Backend Startup

```bash
cd backend

# Development with auto-reload
npm run dev

# Production
npm start
```

The API listens on `http://localhost:5000/api/v1` (health check at `GET /api/v1/health`).

---

## 8. Frontend Startup

```bash
cd frontend

# Development server on http://localhost:3000
npm run dev

# Production build & start
npm run build
npm start
```

Next.js automatically proxies `/api/v1/*` requests to `BACKEND_URL` (`http://localhost:5000`) so `httpOnly` authentication cookies work seamlessly on the same origin.

---

## 9. Docker Startup

To run MySQL 8, Redis 7, the Express backend, and the Next.js frontend with Docker Compose:

```bash
docker compose up --build -d

# Run database migrations and seeders inside the backend container
docker compose exec backend npm run db:migrate
docker compose exec backend npm run db:seed
```

> **Security Note:** MySQL (`127.0.0.1:3306`) and Redis (`127.0.0.1:6379`) ports in `docker-compose.yml` are bound strictly to `127.0.0.1` and are never exposed publicly by default.

---

## 10. Demo Mode Configuration

When `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are not configured (or when viewing a demo workspace with `isDemo = true`):

- The application runs cleanly in **Demo Mode**.
- Outbound messages sent from the Shared Inbox are saved with `status: "simulated"` and are clearly badged in the UI as **Simulated (demo)** — they are **never** marked as delivered.
- Attempting to launch a live broadcast campaign without official WhatsApp credentials returns `409 NOT_CONFIGURED` and guides the user to the Integrations page.
- When `AI_PROVIDER` / `AI_API_KEY` are not configured, the AI Assistant page clearly displays its unconfigured state alongside a labelled sample preview.

---

## 11. Official WhatsApp API Configuration

1. Create a **Meta Developer App** with the **WhatsApp** product enabled in the Meta App Dashboard.
2. Copy your **Access Token**, **Phone Number ID**, **WhatsApp Business Account ID**, and **App Secret** into `backend/.env`.
3. Choose a random `WHATSAPP_WEBHOOK_VERIFY_TOKEN` and set it in `backend/.env`.
4. Configure your webhook callback URL in Meta:
   - **Callback URL:** `https://<your-domain>/api/v1/webhooks/whatsapp`
   - **Verify Token:** value of `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
   - Subscribe to `messages` events.
5. All incoming webhooks are verified using `X-Hub-Signature-256` HMAC-SHA256 against `WHATSAPP_APP_SECRET` and deduplicated via the `webhook_events` table.
6. Message delivery statuses (`accepted` → `sent` → `delivered` → `read` / `failed`) are updated **only** when confirmed by official provider webhook events.

---

## 12. Production Deployment Considerations

- Set `NODE_ENV=production` on both frontend and backend.
- Provide strong, unique secrets (`>= 32` characters) for `AUTH_SECRET`, `PASSWORD_RESET_SECRET`, and `CREDENTIALS_ENCRYPTION_KEY`. The backend refuses to boot in production if required secrets or MySQL credentials are missing.
- Serve traffic over **HTTPS** behind a reverse proxy (Nginx, Caddy, Cloudflare, or cloud load balancer) so `Secure` cookies and webhook TLS verification operate properly.
- Run `npm run db:migrate` during deployment before starting new backend instances. The demo workspace seeder automatically skips when `NODE_ENV=production`.
- Configure `REDIS_URL` in production so BullMQ workers process outbound WhatsApp messages and campaign rate limits reliably across restarts.

---

## Running Automated Tests

The backend test suite tests authentication, input validation, contacts CRUD, strict multi-tenant isolation, webhook signature verification, demo-mode messaging, and campaign pre-launch safeguards:

```bash
cd backend
npm test
```

