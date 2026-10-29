# ChatFlow Backend Architecture & Developer Guide

## 1. Overview & Architecture

The ChatFlow backend (`/backend`) is a multi-tenant Node.js + Express REST & WebSocket service designed for Indian SMBs managing customer enquiries, follow-ups, broadcast campaigns, and workflow automations over WhatsApp.

### Core Principles
1. **Strict Server-Side Multi-Tenancy**: Every authenticated request resolves `req.ctx.businessId` from the user's active `BusinessMember` record via an `httpOnly` JWT session cookie (`cf_session`). Client-supplied `businessId` parameters are never trusted.
2. **Honest WhatsApp & AI Lifecycle**:
   - **Simulated / Demo Mode**: When WhatsApp Cloud API credentials (`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`) are not configured or a conversation is marked `isDemo: true`, outbound messages are stored with `status: "simulated"`. The backend never fabricates `delivered` or `read` receipts.
   - **Live Cloud API Mode**: Outbound messages start as `queued`, transition to `accepted` (storing `providerMessageId`) when Meta's Graph API returns `200 OK`, and only transition to `sent`, `delivered`, `read`, or `failed` when a signed `POST /api/v1/webhooks/whatsapp` status callback is received.
   - **24-Hour Customer Service Window**: Free-form `type: "text"` replies require `conversation.lastInboundAt` to be within the last 24 hours; otherwise `422 VALIDATION_ERROR` is returned instructing the agent to send an approved template.
3. **Encrypted Credentials at Rest**: `BusinessIntegration` encrypts provider secrets using `AES-256-GCM` derived from `CREDENTIALS_ENCRYPTION_KEY` and strips `credentialsEncrypted` in `toJSON()`.

---

## 2. Directory Structure

```text
backend/
├── .sequelizerc
├── .env.example
├── Dockerfile
├── package.json
├── src/
│   ├── app.js                        # Express app + rawBody capture + middleware
│   ├── server.js                     # HTTP server + Socket.IO real-time rooms
│   ├── config/
│   │   ├── env.js                    # Zod-validated environment configuration
│   │   └── database.js               # Sequelize MySQL 8 (and test SQLite) config
│   ├── migrations/                   # 25 ordered Sequelize schema migrations
│   ├── models/                       # 25 Sequelize models + associations
│   ├── seeders/
│   │   ├── runSeed.js                # Idempotent plans + Indian SMB demo workspace seeder
│   │   ├── 20261029000101-seed-plans.js
│   │   └── 20261029000102-seed-demo-workspace.js
│   ├── middleware/
│   │   ├── auth.js                   # cf_session JWT cookie verification & RBAC
│   │   ├── validate.js               # Zod request body/query validation
│   │   ├── rateLimit.js              # Login, password reset & lead form rate limiters
│   │   └── errorHandler.js           # Structured { error: { code, message, details } }
│   ├── integrations/whatsapp/
│   │   ├── WhatsAppCloudProvider.js  # Meta Graph API v21.0 + HMAC-SHA256 webhook verifier
│   │   ├── DemoProvider.js           # Honest simulated provider
│   │   └── index.js                  # Per-business or env provider resolution
│   ├── services/
│   │   ├── workflowEngine.js         # Graph validation & event-driven workflow runner
│   │   ├── aiService.js              # AI reply suggestions, summaries & campaign copy
│   │   ├── usageService.js           # Plan limits & monthly UsageRecord ledger
│   │   └── activityService.js        # Audit & activity feed logger
│   ├── jobs/
│   │   └── outboundQueue.js          # Outbound WhatsApp & campaign dispatch queue
│   ├── controllers/                  # Route handlers
│   └── routes/index.js               # /api/v1 router
└── tests/
    └── api.test.js                   # End-to-end automated test suite
```

---

## 3. Database Schema (25 Tables)

Managed via `sequelize-cli` in `src/migrations/`:
1. `users` — User accounts (`email` unique, `password_hash` stripped on serialization)
2. `plans` — Subscription tiers (`free`, `starter`, `growth`, `pro`, `business`) with INR pricing and JSON limits
3. `businesses` — Tenant workspaces (`slug` unique, `timezone` default `Asia/Kolkata`, `business_hours`, `ai_knowledge`, `is_demo`)
4. `teams` — Department/sales teams within a business
5. `business_members` — User-to-business membership (`owner`, `admin`, `agent`)
6. `subscriptions` — Active plan subscription per business
7. `customers` — Contacts (`(business_id, phone)` unique, paranoid soft-delete, `whatsapp_opt_in`, `opt_in_at`, `opted_out_at`)
8. `customer_tags` — Workspace tags with hex colors
9. `customer_tag_mappings` — Many-to-many join between customers and tags
10. `message_templates` — Approved/draft WhatsApp templates (`marketing`, `utility`, `authentication`)
11. `conversations` — Customer threads (`status`, `unread_count`, `last_message_at`, `last_inbound_at`)
12. `messages` — Inbound/outbound messages & internal notes (`simulated`, `queued`, `accepted`, `sent`, `delivered`, `read`, `failed`, `received`)
13. `follow_up_reminders` — Due/overdue/completed follow-up tasks
14. `campaigns` — Broadcast campaigns with audience filters, INR cost estimate, and stats
15. `campaign_recipients` — Per-recipient delivery tracking (`(campaign_id, customer_id)` unique)
16. `workflows` — Visual automation definitions (`nodes`, `edges`, `trigger_type`, `status`)
17. `workflow_executions` — Execution audit logs per workflow run
18. `business_integrations` — Encrypted provider credentials per workspace
19. `usage_records` — Monthly usage ledger (`messages`, `campaign_messages`, `ai_requests`)
20. `activity_logs` — Workspace activity feed
21. `password_reset_tokens` — SHA-256 hashed, single-use, 30-minute reset tokens
22. `notifications` — In-app member notifications
23. `sales` — Recorded customer orders/sales in INR (`DECIMAL(12,2)`)
24. `webhook_events` — Idempotency table (`(provider, event_id)` unique)
25. `contact_requests` — Public marketing contact/lead submissions

---

## 4. Commands

```bash
# Install dependencies
npm install

# Run database migrations & seed demo workspace (MySQL 8)
npm run db:migrate
npm run db:seed

# Start development server (port 5000)
npm run dev

# Run automated test suite (runs all 25 migrations + seeds against in-memory SQLite)
npm test
```
