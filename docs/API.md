# ChatFlow REST API (v1)

Base path: `/api/v1`. The Next.js frontend proxies `/api/v1/*` to the Express backend
(see `frontend/next.config.mjs`), so browser requests are same-origin.

## Conventions

- **Auth**: httpOnly cookie `cf_session` (JWT signed with `AUTH_SECRET`, HS256, 7 days,
  `SameSite=Lax`, `Secure` in production). Never stored in localStorage.
- **Tenant context**: derived server-side from the authenticated user's `BusinessMember`
  row. Clients never send a `businessId`. Every query on business-owned data is scoped
  with `businessId = req.ctx.businessId`.
- **Success**: `{ "data": <payload>, "meta"?: { page, limit, total, totalPages } }`
- **Error**: `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details"?: [...] } }`
  Codes: `VALIDATION_ERROR` (422), `UNAUTHENTICATED` (401), `FORBIDDEN` (403),
  `NOT_FOUND` (404), `CONFLICT` (409), `RATE_LIMITED` (429), `NOT_CONFIGURED` (409),
  `PLAN_LIMIT` (402), `INTERNAL_ERROR` (500).
- **Pagination**: `?page=1&limit=20` (limit max 100).
- IDs are BIGINT UNSIGNED, serialized as numbers. Money is DECIMAL(12,2), serialized as
  strings (e.g. `"1499.00"`). Timestamps are ISO-8601 UTC.

## Health
- `GET /health` → `{ data: { status: "ok", db: "up"|"down", whatsapp: "configured"|"demo", ai: "configured"|"demo" } }`

## Public
- `GET /plans` → `[{ id, code, name, priceMonthly, priceYearly, limits: {...}, features: [...] }]`
- `POST /contact-requests` `{ name, email, phone?, businessName?, message }` → stored as ActivityLog-free lead (rate limited)

## Auth
- `POST /auth/register` `{ name, email, password, businessName }` → creates User, Business,
  BusinessMember(role=owner), Subscription(plan=free) in one transaction; sets cookie.
  Returns `{ user, business, role }`.
- `POST /auth/login` `{ email, password }` → sets cookie. Rate limited (10 / 15 min / IP+email).
- `POST /auth/logout` → clears cookie.
- `POST /auth/forgot-password` `{ email }` → always 200 with generic message. Creates
  hashed, single-use token (30 min). In development only (`NODE_ENV=development` and email
  not configured) the response includes `devResetUrl`; never in production, never logged.
- `POST /auth/reset-password` `{ token, password }`
- `GET /auth/me` → `{ user: { id, name, email }, business: { id, name, slug, isDemo, industry, timezone }, role, plan: { code, name } }`

## Business
- `GET /businesses/current`
- `PATCH /businesses/current` `{ name?, industry?, timezone?, phone?, website?, businessHours? }` (owner/admin)

## Team
- `GET /team/members` → `[{ id, userId, name, email, role, status }]`

## Contacts (Customer)
Customer shape:
```json
{ "id": 1, "name": "Priya Sharma", "phone": "+919876543210", "email": null,
  "leadStatus": "new|contacted|qualified|customer|lost", "source": "whatsapp|website|walk_in|referral|manual|import",
  "notes": "", "whatsappOptIn": true, "optInAt": "...", "optedOutAt": null,
  "lastContactedAt": "...", "createdAt": "...", "tags": [{ "id": 1, "name": "VIP", "color": "#16C784" }] }
```
- `GET /contacts?page&limit&search&tagId&leadStatus&sort=createdAt|-createdAt|name`
- `POST /contacts` `{ name, phone, email?, leadStatus?, source?, notes?, whatsappOptIn?, tagIds?: [] }`
  (phone unique per business → 409 CONFLICT)
- `GET /contacts/:id` → customer + `followUps[]`, `sales[]`, `conversations[]` (id, status, lastMessageAt)
- `PATCH /contacts/:id` (same fields, partial)
- `DELETE /contacts/:id` (soft delete / paranoid)

## Tags
- `GET /tags` → `[{ id, name, color, customerCount }]`
- `POST /tags` `{ name, color }` · `PATCH /tags/:id` · `DELETE /tags/:id`

## Follow-ups (FollowUpReminder)
Shape: `{ id, customerId, customer: { id, name, phone }, title, notes, dueAt, status: "pending|completed|cancelled", completedAt, assignedToUserId }`
- `GET /follow-ups?status&due=overdue|today|upcoming&customerId&page&limit`
- `POST /follow-ups` `{ customerId, title, dueAt, notes? }`
- `PATCH /follow-ups/:id` `{ title?, dueAt?, notes?, status? }`
- `DELETE /follow-ups/:id`

## Sales
- `GET /sales?customerId&page&limit` · `POST /sales` `{ customerId, amount, note?, recordedAt? }`

## Conversations
Shape: `{ id, channel: "whatsapp", status: "open|pending|resolved", isDemo, unreadCount,
  lastMessageAt, lastMessagePreview, assignedTo: { id, name } | null, customer: { id, name, phone, leadStatus, tags } }`
- `GET /conversations?status&search&assigned=me|unassigned&page&limit`
- `GET /conversations/:id`
- `PATCH /conversations/:id` `{ status?, assignedToUserId? (must be a member) }`

## Messages
Shape: `{ id, conversationId, direction: "inbound|outbound", type: "text|template|note", body,
  status: "simulated|queued|accepted|sent|delivered|read|failed|received", providerMessageId,
  errorMessage, sentBy: { id, name } | null, createdAt }`
- `GET /conversations/:id/messages?before&limit`
- `POST /conversations/:id/messages` `{ body, type: "text"|"note" }`
  - `note` → internal note, never sent.
  - `text` + demo conversation or WhatsApp not configured → stored with `status: "simulated"`
    (clearly not delivered).
  - `text` + configured → stored `queued`; job sends via provider; `accepted` on provider
    200 with `providerMessageId`; `delivered/read/failed` only via webhook status events.
  - Outside the 24h customer-service window → 422 (template required).

## Templates (MessageTemplate)
- `GET /templates` → `[{ id, name, category: "marketing|utility|authentication", language, body, variables, status: "approved|pending|rejected|draft", isDemo }]`

## Campaigns
Shape: `{ id, name, status: "draft|scheduled|sending|completed|failed|cancelled", templateId,
  template, audience: { tagIds: [], leadStatuses: [] }, scheduledAt, estimatedRecipients,
  estimatedCost: "12.32", currency: "INR", stats: { total, queued, accepted, delivered, read, failed, skipped } }`
- `GET /campaigns?status&page&limit`
- `POST /campaigns` `{ name, templateId, audience, scheduledAt? }` → draft
- `GET /campaigns/:id`
- `PATCH /campaigns/:id` (drafts only)
- `POST /campaigns/:id/validate` → `{ ready: bool, checks: [{ key, ok, message }], eligibleRecipients, excluded: { noOptIn, optedOut, duplicate } , estimatedCost }`
- `POST /campaigns/:id/launch` → 409 `NOT_CONFIGURED` when WhatsApp is not configured; otherwise
  creates CampaignRecipient rows (opt-in only, deduped) in a transaction and enqueues jobs.

## Workflows
Shape: `{ id, name, status: "draft|published|paused", trigger: { type, config }, definition: { nodes: [...], edges: [...] }, publishedAt, executionCount }`
Supported node types:
- triggers: `new_conversation`, `keyword_received` (`{ keywords: [] }`), `tag_added` (`{ tagId }`)
- conditions: `business_hours`, `has_tag` (`{ tagId }`), `lead_status_is` (`{ status }`)
- actions: `assign_member` (`{ userId }`|round robin), `send_reply` (`{ text }`), `create_follow_up` (`{ title, delayHours }`), `update_lead_status` (`{ status }`), `add_tag` (`{ tagId }`)
- `GET /workflows` · `POST /workflows` · `GET /workflows/:id` · `PATCH /workflows/:id`
- `POST /workflows/:id/publish` (validates graph: exactly one trigger, all node types supported, connected)

## Analytics
- `GET /analytics/overview?days=30` →
  `{ totals: { contacts, newEnquiries, openConversations, followUpsDue, activeCampaigns, recordedSales },
     enquiriesSeries: [{ date, count }], salesSeries: [{ date, amount }],
     leadFunnel: [{ status, count }], recentActivity: [{ id, type, description, createdAt, actor }] }`
- `GET /analytics/conversations?days=30` → `{ byStatus: [{status,count}], series: [{ date, inbound, outbound }] }`
- `GET /analytics/campaigns` → `{ campaigns: [{ id, name, stats }], totals }`

## Billing
- `GET /billing/subscription` → `{ plan, status, currentPeriodEnd, billingCycle }`
- `GET /billing/usage` → `{ period, items: [{ metric: "contacts|messages|ai_requests|campaign_messages", used, limit, cost }] }`

## AI
- `GET /ai/status` → `{ configured: bool, provider, usage: { used, limit } }`
- `POST /ai/reply-suggestions` `{ conversationId }` · `POST /ai/summarize` `{ conversationId }` · `POST /ai/campaign-copy` `{ goal, tone }`
  → 409 `NOT_CONFIGURED` when no provider; PLAN_LIMIT when over limit.

## Integrations
- `GET /integrations` → `[{ provider: "whatsapp_cloud", status: "not_configured|configured|error", source: "env|business", details }]` (never returns secrets)

## WhatsApp webhooks (no auth cookie; signature verified)
- `GET /webhooks/whatsapp` — `hub.mode`, `hub.verify_token`, `hub.challenge` verification
- `POST /webhooks/whatsapp` — `X-Hub-Signature-256` verified with `WHATSAPP_APP_SECRET` against raw body;
  events deduplicated by provider event/message id.

