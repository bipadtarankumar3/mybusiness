'use strict';

process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';
process.env.AUTH_SECRET = 'test-auth-secret-at-least-32-characters-long-12345';
process.env.PASSWORD_RESET_SECRET = 'test-reset-secret-key-1234567890';
process.env.CREDENTIALS_ENCRYPTION_KEY = 'test-credentials-encryption-key-12345';
process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = 'chatflow-verify-token-test';
process.env.WHATSAPP_APP_SECRET = 'whatsapp-app-secret-test-key';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const request = require('supertest');

const { setEnvOverrides } = require('../src/config/env');
const models = require('../src/models');
const app = require('../src/app');
const { seedAll } = require('../src/seeders/runSeed');
const { flushOutboundQueue } = require('../src/jobs/outboundQueue');

async function runAllMigrations() {
  const migrationsDir = path.resolve(__dirname, '../src/migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.js'))
    .sort();
  const queryInterface = models.sequelize.getQueryInterface();
  for (const file of files) {
    const migration = require(path.join(migrationsDir, file));
    await migration.up(queryInterface, models.Sequelize);
  }
}

function signWebhookPayload(bodyObj, secret = process.env.WHATSAPP_APP_SECRET) {
  const raw = JSON.stringify(bodyObj);
  const sig = crypto.createHmac('sha256', secret).update(raw, 'utf8').digest('hex');
  return { raw, signature: `sha256=${sig}` };
}

describe('ChatFlow Backend API & Integration Suite', () => {
  let demoAgent;
  let otherTenantAgent;

  before(async () => {
    await runAllMigrations();
    await seedAll(models);

    demoAgent = request.agent(app);
    const loginRes = await demoAgent
      .post('/api/v1/auth/login')
      .send({ email: 'demo@chatflow.local', password: 'Demo@12345' });
    assert.equal(loginRes.status, 200);

    otherTenantAgent = request.agent(app);
    const otherLoginRes = await otherTenantAgent
      .post('/api/v1/auth/login')
      .send({ email: 'other@chatflow.local', password: 'Demo@12345' });
    assert.equal(otherLoginRes.status, 200);
  });

  after(async () => {
    await flushOutboundQueue();
    await models.sequelize.close();
  });

  test('1. Health & Public Plans & Contact Requests', async () => {
    const healthRes = await request(app).get('/api/v1/health');
    assert.equal(healthRes.status, 200);
    assert.equal(healthRes.body.data.status, 'ok');
    assert.equal(healthRes.body.data.db, 'up');
    assert.equal(healthRes.body.data.whatsapp, 'demo');
    assert.equal(healthRes.body.data.ai, 'demo');

    const plansRes = await request(app).get('/api/v1/plans');
    assert.equal(plansRes.status, 200);
    assert.equal(plansRes.body.data.length, 5);
    const codes = plansRes.body.data.map((p) => p.code);
    assert.deepEqual(codes, ['free', 'starter', 'growth', 'pro', 'business']);
    const starter = plansRes.body.data.find((p) => p.code === 'starter');
    assert.equal(starter.priceMonthly, '199.00');
    assert.equal(starter.priceYearly, '1990.00');

    const contactRes = await request(app).post('/api/v1/contact-requests').send({
      name: 'Vikramaditya Rao',
      email: 'vikram@ethnicbazaar.in',
      phone: '+919811122233',
      businessName: 'Ethnic Bazaar',
      message: 'We want to onboard 8 sales agents onto ChatFlow Pro.',
    });
    assert.equal(contactRes.status, 201);
    assert.equal(contactRes.body.data.email, 'vikram@ethnicbazaar.in');
  });

  test('2. BusinessIntegration encrypts credentials at rest and never serializes them', async () => {
    const integration = await models.BusinessIntegration.findOne({
      where: { provider: 'whatsapp_cloud' },
    });
    integration.setCredentials({ accessToken: 'EAAB-secret-token', phoneNumberId: '1099887766' });
    await integration.save();

    assert.ok(integration.credentialsEncrypted);
    assert.ok(!integration.credentialsEncrypted.includes('EAAB-secret-token'));
    assert.deepEqual(integration.getCredentials(), {
      accessToken: 'EAAB-secret-token',
      phoneNumberId: '1099887766',
    });

    const json = integration.toJSON();
    assert.equal(json.credentialsEncrypted, undefined);

    // Reset back to unconfigured for demo tests
    integration.setCredentials(null);
    integration.status = 'not_configured';
    await integration.save();
  });

  test('3. Auth register, /auth/me, password reset single-use token, and logout', async () => {
    const regAgent = request.agent(app);
    const regRes = await regAgent.post('/api/v1/auth/register').send({
      name: 'Kiran Desai',
      email: 'kiran@desaigems.in',
      password: 'Password@123',
      businessName: 'Desai Gems & Jewels',
    });
    assert.equal(regRes.status, 201);
    assert.equal(regRes.body.data.user.email, 'kiran@desaigems.in');
    assert.equal(regRes.body.data.business.isDemo, false);
    assert.equal(regRes.body.data.role, 'owner');
    assert.equal(regRes.body.data.plan.code, 'free');

    const meRes = await regAgent.get('/api/v1/auth/me');
    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.data.business.name, 'Desai Gems & Jewels');

    // Forgot password & single-use reset token
    const forgotRes = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'kiran@desaigems.in' });
    assert.equal(forgotRes.status, 200);
    assert.ok(forgotRes.body.data.devResetUrl);
    const rawToken = new URL(forgotRes.body.data.devResetUrl).searchParams.get('token');
    assert.ok(rawToken);

    const resetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: rawToken, password: 'NewPassword@456' });
    assert.equal(resetRes.status, 200);

    // Reusing the same reset token must fail with 422
    const replayReset = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: rawToken, password: 'AnotherPassword@789' });
    assert.equal(replayReset.status, 422);

    // Logout clears session cookie
    const logoutRes = await regAgent.post('/api/v1/auth/logout');
    assert.equal(logoutRes.status, 200);
    const afterLogoutMe = await regAgent.get('/api/v1/auth/me');
    assert.equal(afterLogoutMe.status, 401);

    // Google Login: creates a new user + workspace if email does not exist yet
    const googleAgent = request.agent(app);
    const googleNewRes = await googleAgent.post('/api/v1/auth/google').send({
      email: 'newgoogleuser@mybusiness.in',
      name: 'Rohan Kapoor',
      googleId: 'google-sub-123456',
      businessName: 'Kapoor Electronics',
    });
    assert.equal(googleNewRes.status, 201);
    assert.equal(googleNewRes.body.data.isNewUser, true);
    assert.equal(googleNewRes.body.data.user.email, 'newgoogleuser@mybusiness.in');
    assert.equal(googleNewRes.body.data.business.name, 'Kapoor Electronics');

    // Subsequent Google Login for same user signs into the existing account (200, isNewUser: false)
    const googleExistingRes = await googleAgent.post('/api/v1/auth/google').send({
      email: 'newgoogleuser@mybusiness.in',
      name: 'Rohan Kapoor',
      googleId: 'google-sub-123456',
    });
    assert.equal(googleExistingRes.status, 200);
    assert.equal(googleExistingRes.body.data.isNewUser, false);
  });

  test('4. Strict Multi-Tenant Isolation between workspaces', async () => {
    const demoContactsRes = await demoAgent.get('/api/v1/contacts');
    assert.equal(demoContactsRes.status, 200);
    const demoCustomerId = demoContactsRes.body.data[0].id;

    // Business B trying to read, patch, or delete Business A's contact gets 404
    const getFromOther = await otherTenantAgent.get(`/api/v1/contacts/${demoCustomerId}`);
    assert.equal(getFromOther.status, 404);

    const patchFromOther = await otherTenantAgent
      .patch(`/api/v1/contacts/${demoCustomerId}`)
      .send({ name: 'Hacked Name' });
    assert.equal(patchFromOther.status, 404);

    const delFromOther = await otherTenantAgent.delete(`/api/v1/contacts/${demoCustomerId}`);
    assert.equal(delFromOther.status, 404);

    // Business B list only shows its own 1 seeded contact
    const otherList = await otherTenantAgent.get('/api/v1/contacts');
    assert.equal(otherList.status, 200);
    assert.equal(otherList.body.meta.total, 1);
    assert.equal(otherList.body.data[0].name, 'Private Tenant Customer');
  });

  test('5. Contacts CRUD, duplicate phone 409, Tags, Follow-ups, and Sales', async () => {
    // Create tag
    const tagRes = await demoAgent.post('/api/v1/tags').send({ name: 'Bridal Trial', color: '#E11D48' });
    assert.equal(tagRes.status, 201);
    const tagId = tagRes.body.data.id;

    // Create contact with 10-digit Indian phone -> normalized to +91
    const createRes = await demoAgent.post('/api/v1/contacts').send({
      name: 'Aditi Kulkarni',
      phone: '9823456789',
      email: 'aditi.k@example.com',
      leadStatus: 'qualified',
      source: 'whatsapp',
      whatsappOptIn: true,
      tagIds: [tagId],
    });
    assert.equal(createRes.status, 201);
    assert.equal(createRes.body.data.phone, '+919823456789');
    assert.equal(createRes.body.data.tags.length, 1);
    const contactId = createRes.body.data.id;

    // Duplicate phone in same workspace returns 409 CONFLICT
    const dupRes = await demoAgent.post('/api/v1/contacts').send({
      name: 'Duplicate Aditi',
      phone: '+919823456789',
    });
    assert.equal(dupRes.status, 409);
    assert.equal(dupRes.body.error.code, 'CONFLICT');

    // Follow-ups CRUD
    const followUpRes = await demoAgent.post('/api/v1/follow-ups').send({
      customerId: contactId,
      title: 'Send lehenga measurement guide',
      dueAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      notes: 'Include blouse chart',
    });
    assert.equal(followUpRes.status, 201);
    const followUpId = followUpRes.body.data.id;

    const completeFollowUp = await demoAgent
      .patch(`/api/v1/follow-ups/${followUpId}`)
      .send({ status: 'completed' });
    assert.equal(completeFollowUp.status, 200);
    assert.equal(completeFollowUp.body.data.status, 'completed');
    assert.ok(completeFollowUp.body.data.completedAt);

    // Record Sale
    const saleRes = await demoAgent.post('/api/v1/sales').send({
      customerId: contactId,
      amount: 12500.5,
      note: 'Custom Bridal Lehenga Advance',
    });
    assert.equal(saleRes.status, 201);
    assert.equal(saleRes.body.data.amount, '12500.50');

    // Contact detail includes followUps and sales
    const detailRes = await demoAgent.get(`/api/v1/contacts/${contactId}`);
    assert.equal(detailRes.status, 200);
    assert.equal(detailRes.body.data.sales.length, 1);
    assert.equal(detailRes.body.data.followUps.length, 1);
  });

  test('6. Conversations & Honest Message Status Lifecycle (simulated vs queued -> accepted -> delivered)', async () => {
    const convList = await demoAgent.get('/api/v1/conversations');
    assert.equal(convList.status, 200);
    assert.ok(convList.body.data.length >= 8);
    const demoConv = convList.body.data[0];

    // Internal note
    const noteRes = await demoAgent
      .post(`/api/v1/conversations/${demoConv.id}/messages`)
      .send({ body: 'Customer prefers afternoon delivery.', type: 'note' });
    assert.equal(noteRes.status, 201);
    assert.equal(noteRes.body.data.type, 'note');

    // Text reply in demo mode -> status MUST be 'simulated', never fake 'delivered'
    const simMsgRes = await demoAgent
      .post(`/api/v1/conversations/${demoConv.id}/messages`)
      .send({ body: 'Sharing the emerald green saree pictures now!', type: 'text' });
    assert.equal(simMsgRes.status, 201);
    assert.equal(simMsgRes.body.data.status, 'simulated');

    // 24h customer-service window enforcement
    const expiredConv = await models.Conversation.create({
      businessId: 1,
      customerId: demoConv.customer.id,
      channel: 'whatsapp',
      status: 'open',
      isDemo: false,
      lastInboundAt: new Date(Date.now() - 30 * 3600 * 1000), // 30 hours ago
    });
    const expiredRes = await demoAgent
      .post(`/api/v1/conversations/${expiredConv.id}/messages`)
      .send({ body: 'Hello after 30 hours', type: 'text' });
    assert.equal(expiredRes.status, 422);
    assert.equal(expiredRes.body.error.code, 'VALIDATION_ERROR');
  });

  test('7. Configured WhatsApp Cloud API + Signed Webhook Status & Inbound Idempotency', async () => {
    // Enable WhatsApp Cloud API credentials and mock Meta Graph API fetch
    setEnvOverrides({
      WHATSAPP_ACCESS_TOKEN: 'EAAB-live-token',
      WHATSAPP_PHONE_NUMBER_ID: '9988776655',
    });

    const originalFetch = global.fetch;
    let fetchCounter = 0;
    global.fetch = async () => {
      fetchCounter += 1;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          messaging_product: 'whatsapp',
          messages: [{ id: `wamid.live_${fetchCounter}` }],
        }),
      };
    };

    try {
      // Inbound webhook with invalid signature is rejected with 401
      const badWebhook = await request(app)
        .post('/api/v1/webhooks/whatsapp')
        .set('X-Hub-Signature-256', 'sha256=deadbeef')
        .send({ object: 'whatsapp_business_account', entry: [] });
      assert.equal(badWebhook.status, 401);

      // Valid signed inbound message webhook creates contact, conversation, message, and triggers workflow
      const inboundPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WABA_1',
            changes: [
              {
                field: 'messages',
                value: {
                  metadata: { phone_number_id: '9988776655' },
                  contacts: [{ wa_id: '919765432109', profile: { name: 'Riya Sen' } }],
                  messages: [
                    {
                      id: 'wamid.inbound_riya_001',
                      from: '919765432109',
                      timestamp: String(Math.floor(Date.now() / 1000)),
                      type: 'text',
                      text: { body: 'Hi, please share festive saree price!' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const signedInbound = signWebhookPayload(inboundPayload);
      const webhookRes1 = await request(app)
        .post('/api/v1/webhooks/whatsapp')
        .set('Content-Type', 'application/json')
        .set('X-Hub-Signature-256', signedInbound.signature)
        .send(signedInbound.raw);
      assert.equal(webhookRes1.status, 200);
      assert.equal(webhookRes1.body.data.processedEvents, 1);
      assert.equal(webhookRes1.body.data.duplicateEvents, 0);

      // Replaying the exact same webhook is idempotent (deduplicated)
      const webhookRes2 = await request(app)
        .post('/api/v1/webhooks/whatsapp')
        .set('Content-Type', 'application/json')
        .set('X-Hub-Signature-256', signedInbound.signature)
        .send(signedInbound.raw);
      assert.equal(webhookRes2.status, 200);
      assert.equal(webhookRes2.body.data.processedEvents, 0);
      assert.equal(webhookRes2.body.data.duplicateEvents, 1);

      // Send outbound message on non-demo conversation -> queued -> accepted with providerMessageId
      const liveConv = await models.Conversation.findOne({
        where: { isDemo: false },
        order: [['id', 'DESC']],
      });
      await liveConv.update({ lastInboundAt: new Date() });

      const sendRes = await demoAgent
        .post(`/api/v1/conversations/${liveConv.id}/messages`)
        .send({ body: 'Hello! Here is our catalog link.', type: 'text' });
      assert.equal(sendRes.status, 201);
      await flushOutboundQueue();

      const updatedMsg = await models.Message.findByPk(sendRes.body.data.id);
      assert.equal(updatedMsg.status, 'accepted');
      assert.ok(updatedMsg.providerMessageId.startsWith('wamid.live_'));

      // Webhook status callback transitions message from 'accepted' -> 'delivered'
      const statusPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WABA_1',
            changes: [
              {
                field: 'messages',
                value: {
                  metadata: { phone_number_id: '9988776655' },
                  statuses: [
                    {
                      id: updatedMsg.providerMessageId,
                      status: 'delivered',
                      timestamp: String(Math.floor(Date.now() / 1000)),
                    },
                  ],
                },
              },
            ],
          },
        ],
      };
      const signedStatus = signWebhookPayload(statusPayload);
      const statusWebhookRes = await request(app)
        .post('/api/v1/webhooks/whatsapp')
        .set('Content-Type', 'application/json')
        .set('X-Hub-Signature-256', signedStatus.signature)
        .send(signedStatus.raw);
      assert.equal(statusWebhookRes.status, 200);

      await updatedMsg.reload();
      assert.equal(updatedMsg.status, 'delivered');
    } finally {
      global.fetch = originalFetch;
      setEnvOverrides({
        WHATSAPP_ACCESS_TOKEN: undefined,
        WHATSAPP_PHONE_NUMBER_ID: undefined,
      });
    }
  });

  test('8. Campaigns validation & launch guard when WhatsApp unconfigured vs configured', async () => {
    const templatesRes = await demoAgent.get('/api/v1/templates');
    assert.equal(templatesRes.status, 200);
    const tplId = templatesRes.body.data[0].id;

    const createCampRes = await demoAgent.post('/api/v1/campaigns').send({
      name: 'November Wedding Edit Broadcast',
      templateId: tplId,
      audience: { tagIds: [], leadStatuses: ['qualified', 'customer'] },
    });
    assert.equal(createCampRes.status, 201);
    const campId = createCampRes.body.data.id;

    const valRes = await demoAgent.post(`/api/v1/campaigns/${campId}/validate`);
    assert.equal(valRes.status, 200);
    assert.ok(valRes.body.data.eligibleRecipients > 0);
    assert.ok(valRes.body.data.excluded.optedOut >= 1);

    // Launching when WhatsApp is not configured returns 409 NOT_CONFIGURED
    const launchBlocked = await demoAgent.post(`/api/v1/campaigns/${campId}/launch`);
    assert.equal(launchBlocked.status, 409);
    assert.equal(launchBlocked.body.error.code, 'NOT_CONFIGURED');
  });

  test('9. Workflows validation on publish', async () => {
    // Create workflow with disconnected node -> publish fails with 422
    const badWfRes = await demoAgent.post('/api/v1/workflows').send({
      name: 'Broken Graph Workflow',
      definition: {
        nodes: [
          { id: 't1', type: 'new_conversation', config: {} },
          { id: 'a1', type: 'send_reply', config: { text: 'Hi' } },
        ],
        edges: [], // disconnected!
      },
    });
    assert.equal(badWfRes.status, 201);

    const pubBadRes = await demoAgent.post(`/api/v1/workflows/${badWfRes.body.data.id}/publish`);
    assert.equal(pubBadRes.status, 422);
    assert.equal(pubBadRes.body.error.code, 'VALIDATION_ERROR');

    // Fix edge and publish -> 200
    await demoAgent.patch(`/api/v1/workflows/${badWfRes.body.data.id}`).send({
      definition: {
        nodes: [
          { id: 't1', type: 'new_conversation', config: {} },
          { id: 'a1', type: 'send_reply', config: { text: 'Hi' } },
        ],
        edges: [{ from: 't1', to: 'a1' }],
      },
    });
    const pubGoodRes = await demoAgent.post(`/api/v1/workflows/${badWfRes.body.data.id}/publish`);
    assert.equal(pubGoodRes.status, 200);
    assert.equal(pubGoodRes.body.data.status, 'published');
  });

  test('10. Analytics, Billing Usage, and AI Assistant guard & execution', async () => {
    const overviewRes = await demoAgent.get('/api/v1/analytics/overview?days=30');
    assert.equal(overviewRes.status, 200);
    assert.ok(overviewRes.body.data.totals.contacts >= 25);
    assert.equal(overviewRes.body.data.enquiriesSeries.length, 30);
    assert.equal(overviewRes.body.data.salesSeries.length, 30);

    const subRes = await demoAgent.get('/api/v1/billing/subscription');
    assert.equal(subRes.status, 200);
    assert.equal(subRes.body.data.plan.code, 'growth');

    const usageRes = await demoAgent.get('/api/v1/billing/usage');
    assert.equal(usageRes.status, 200);
    assert.equal(usageRes.body.data.items.length, 4);

    // AI Assistant returns 409 NOT_CONFIGURED when unconfigured
    const aiUnconf = await demoAgent.post('/api/v1/ai/campaign-copy').send({
      goal: 'Diwali 20% off on silk sarees',
      tone: 'festive',
    });
    assert.equal(aiUnconf.status, 409);
    assert.equal(aiUnconf.body.error.code, 'NOT_CONFIGURED');

    // Configure AI and verify response + usage tracking
    setEnvOverrides({
      AI_PROVIDER: 'openai',
      AI_API_KEY: 'sk-test-ai-key',
    });
    try {
      const aiCopyRes = await demoAgent.post('/api/v1/ai/campaign-copy').send({
        goal: 'Diwali 20% off on silk sarees',
        tone: 'festive',
      });
      assert.equal(aiCopyRes.status, 200);
      assert.ok(Array.isArray(aiCopyRes.body.data.variants));
      assert.equal(aiCopyRes.body.data.variants.length, 2);
    } finally {
      setEnvOverrides({
        AI_PROVIDER: undefined,
        AI_API_KEY: undefined,
      });
    }
  });

  test('11. Super Admin Console: users list & counts, user settings, plan builder, subscriptions, and visit user dashboard (impersonation)', async () => {
    // Non-super-admin (otherTenantAgent) is blocked from /api/v1/admin/* with 403
    const forbiddenRes = await otherTenantAgent.get('/api/v1/admin/overview');
    assert.equal(forbiddenRes.status, 403);

    // Super Admin login (admin@chatflow.local)
    const adminAgent = request.agent(app);
    const adminLoginRes = await adminAgent
      .post('/api/v1/auth/login')
      .send({ email: 'admin@chatflow.local', password: 'Admin@12345' });
    assert.equal(adminLoginRes.status, 200);
    assert.equal(adminLoginRes.body.data.user.isSuperAdmin, true);

    // Admin overview
    const overviewRes = await adminAgent.get('/api/v1/admin/overview');
    assert.equal(overviewRes.status, 200);
    assert.ok(overviewRes.body.data.counts.totalUsers >= 5);
    assert.ok(overviewRes.body.data.counts.totalBusinesses >= 2);

    // Users list with counts and filters
    const usersRes = await adminAgent.get('/api/v1/admin/users?status=active');
    assert.equal(usersRes.status, 200);
    assert.ok(usersRes.body.data.length >= 5);
    assert.ok(usersRes.body.meta.counts.all >= 5);

    // Create a new subscription plan via Super Admin Plan Builder
    const newPlanRes = await adminAgent.post('/api/v1/admin/plans').send({
      code: 'enterprise_plus',
      name: 'Enterprise Plus',
      priceMonthly: 2999,
      priceYearly: 29990,
      sortOrder: 6,
      limits: {
        contacts: 100000,
        teamMembers: 50,
        campaignsPerMonth: 500,
        workflows: 200,
        aiRepliesPerMonth: 20000,
      },
      features: ['Dedicated WhatsApp Solution Architect', 'Custom SLA & Webhook Priority'],
    });
    assert.equal(newPlanRes.status, 201);
    assert.equal(newPlanRes.body.data.code, 'enterprise_plus');

    // Update a user's settings & subscription plan via PATCH /api/v1/admin/users/:id
    const targetUser = usersRes.body.data.find((u) => u.email === 'other@chatflow.local');
    assert.ok(targetUser);
    const patchUserRes = await adminAgent.patch(`/api/v1/admin/users/${targetUser.id}`).send({
      name: 'Other Tenant Owner Updated',
      planCode: 'enterprise_plus',
      billingCycle: 'yearly',
    });
    assert.equal(patchUserRes.status, 200);
    assert.equal(patchUserRes.body.data.name, 'Other Tenant Owner Updated');

    // List all subscriptions
    const subsRes = await adminAgent.get('/api/v1/admin/subscriptions');
    assert.equal(subsRes.status, 200);
    assert.ok(subsRes.body.data.length >= 2);

    // Visit target user's dashboard (impersonation)
    const impRes = await adminAgent
      .post('/api/v1/admin/impersonate')
      .send({ userId: targetUser.id });
    assert.equal(impRes.status, 200);
    assert.equal(impRes.body.data.user.email, 'other@chatflow.local');
    assert.ok(impRes.body.data.impersonatedBy);

    // Verify contacts returned now belong to Other Tenant Workspace
    const impContacts = await adminAgent.get('/api/v1/contacts');
    assert.equal(impContacts.status, 200);
    assert.equal(impContacts.body.data[0].name, 'Private Tenant Customer');

    // Exit Visitor Mode back to Super Admin session
    const stopImpRes = await adminAgent.post('/api/v1/admin/stop-impersonation');
    assert.equal(stopImpRes.status, 200);
    assert.equal(stopImpRes.body.data.user.email, 'admin@chatflow.local');
    assert.equal(stopImpRes.body.data.impersonatedBy, null);
  });

  test('12. Facebook login, Razorpay settings, and direct billing checkout upgrade', async () => {
    // 1. Facebook Sign-In creates new user & isolated workspace with free tier plan
    const fbAgent = request.agent(app);
    const fbEmail = 'priya.sharma@facebook.test';
    const fbRes = await fbAgent.post('/api/v1/auth/facebook').send({
      email: fbEmail,
      name: 'Priya Sharma',
      facebookId: 'fb_priya_12345',
      businessName: 'Priya Ethnic Studio',
    });
    assert.equal(fbRes.status, 201);
    assert.equal(fbRes.body.data.user.email, fbEmail);
    assert.equal(fbRes.body.data.business.name, 'Priya Ethnic Studio');
    assert.equal(fbRes.body.data.plan.code, 'free');
    assert.equal(fbRes.body.data.isNewUser, true);

    // 2. Existing Facebook Sign-In logs user in immediately
    const fbLoginRes = await fbAgent.post('/api/v1/auth/facebook').send({
      email: fbEmail,
      facebookId: 'fb_priya_12345',
    });
    assert.equal(fbLoginRes.status, 200);
    assert.equal(fbLoginRes.body.data.isNewUser, false);

    // 3. Configure Razorpay Payment Gateway details in Settings
    const getGatewayInitial = await fbAgent.get('/api/v1/settings/payment-gateway');
    assert.equal(getGatewayInitial.status, 200);

    const saveGatewayRes = await fbAgent.post('/api/v1/settings/payment-gateway').send({
      keyId: 'rzp_test_5678abcdef9012',
      keySecret: 'secret_key_testing_123456',
      webhookSecret: 'whsec_testing_789',
      isTestMode: true,
      accountName: 'Priya Ethnic Store Gateway',
    });
    assert.equal(saveGatewayRes.status, 200);
    assert.equal(saveGatewayRes.body.data.configured, true);
    assert.equal(saveGatewayRes.body.data.isTestMode, true);
    assert.equal(saveGatewayRes.body.data.keyId, 'rzp_test_5678abcdef9012');

    // 4. Create direct checkout order for Starter plan
    const orderRes = await fbAgent.post('/api/v1/billing/create-order').send({
      planCode: 'starter',
      billingCycle: 'monthly',
    });
    assert.equal(orderRes.status, 200);
    assert.ok(orderRes.body.data.orderId);
    assert.equal(orderRes.body.data.currency, 'INR');
    assert.equal(orderRes.body.data.plan.code, 'starter');

    // 5. Complete payment verification and upgrade subscription
    const verifyRes = await fbAgent.post('/api/v1/billing/verify-payment').send({
      planCode: 'starter',
      billingCycle: 'monthly',
      razorpayOrderId: orderRes.body.data.orderId,
      razorpayPaymentId: 'pay_test_priya_9999',
    });
    assert.equal(verifyRes.status, 200);
    assert.equal(verifyRes.body.data.success, true);
    assert.equal(verifyRes.body.data.subscription.plan.code, 'starter');

    // 6. Verify upgraded subscription state via GET /api/v1/billing/subscription
    const subRes = await fbAgent.get('/api/v1/billing/subscription');
    assert.equal(subRes.status, 200);
    assert.equal(subRes.body.data.plan.code, 'starter');
    assert.equal(subRes.body.data.status, 'active');
  });
});
