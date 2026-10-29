'use strict';

const express = require('express');
const { requireAuth, requireRole, requireSuperAdmin } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const {
  loginRateLimiter,
  forgotPasswordRateLimiter,
  contactRequestRateLimiter,
} = require('../middleware/rateLimit');

const publicCtrl = require('../controllers/publicController');
const authCtrl = require('../controllers/authController');
const businessCtrl = require('../controllers/businessController');
const contactsCtrl = require('../controllers/contactsController');
const followUpsSalesCtrl = require('../controllers/followUpsSalesController');
const conversationsCtrl = require('../controllers/conversationsController');
const campaignsCtrl = require('../controllers/campaignsController');
const workflowsCtrl = require('../controllers/workflowsController');
const analyticsBillingAiCtrl = require('../controllers/analyticsBillingAiController');
const webhooksCtrl = require('../controllers/webhooksController');
const adminCtrl = require('../controllers/adminController');

const router = express.Router();

// Health & Public
router.get('/health', publicCtrl.getHealth);
router.get('/plans', publicCtrl.getPlans);
router.post(
  '/contact-requests',
  contactRequestRateLimiter,
  validateBody(publicCtrl.contactRequestSchema),
  publicCtrl.createContactRequest
);

// Webhooks (signature-verified, no session cookie)
router.get('/webhooks/whatsapp', webhooksCtrl.verifyWhatsappWebhook);
router.post('/webhooks/whatsapp', webhooksCtrl.receiveWhatsappWebhook);

// Auth
router.post('/auth/register', validateBody(authCtrl.registerSchema), authCtrl.register);
router.post('/auth/login', loginRateLimiter, validateBody(authCtrl.loginSchema), authCtrl.login);
router.post('/auth/google', loginRateLimiter, validateBody(authCtrl.googleLoginSchema), authCtrl.googleLogin);
router.get('/auth/google', authCtrl.googleRedirect);
router.get('/auth/google/callback', authCtrl.googleCallback);
router.post('/auth/facebook', loginRateLimiter, validateBody(authCtrl.facebookLoginSchema), authCtrl.facebookLogin);
router.get('/auth/facebook', authCtrl.facebookRedirect);
router.get('/auth/facebook/callback', authCtrl.facebookCallback);
router.post('/auth/logout', authCtrl.logout);
router.post(
  '/auth/forgot-password',
  forgotPasswordRateLimiter,
  validateBody(authCtrl.forgotPasswordSchema),
  authCtrl.forgotPassword
);
router.post('/auth/reset-password', validateBody(authCtrl.resetPasswordSchema), authCtrl.resetPassword);
router.get('/auth/me', requireAuth, authCtrl.me);

// Business & Team & Integrations
router.get('/businesses/current', requireAuth, businessCtrl.getCurrentBusiness);
router.patch(
  '/businesses/current',
  requireAuth,
  requireRole('owner', 'admin'),
  validateBody(businessCtrl.updateBusinessSchema),
  businessCtrl.updateCurrentBusiness
);
router.get('/team/members', requireAuth, businessCtrl.getTeamMembers);
router.get('/integrations', requireAuth, businessCtrl.getIntegrations);

// Contacts & Tags
router.get('/contacts', requireAuth, contactsCtrl.listContacts);
router.post('/contacts', requireAuth, validateBody(contactsCtrl.createContactSchema), contactsCtrl.createContact);
router.get('/contacts/:id', requireAuth, contactsCtrl.getContact);
router.patch('/contacts/:id', requireAuth, validateBody(contactsCtrl.updateContactSchema), contactsCtrl.updateContact);
router.delete('/contacts/:id', requireAuth, contactsCtrl.deleteContact);

router.get('/tags', requireAuth, contactsCtrl.listTags);
router.post('/tags', requireAuth, validateBody(contactsCtrl.tagSchema), contactsCtrl.createTag);
router.patch('/tags/:id', requireAuth, validateBody(contactsCtrl.tagSchema.partial()), contactsCtrl.updateTag);
router.delete('/tags/:id', requireAuth, contactsCtrl.deleteTag);

// Follow-ups & Sales
router.get('/follow-ups', requireAuth, followUpsSalesCtrl.listFollowUps);
router.post(
  '/follow-ups',
  requireAuth,
  validateBody(followUpsSalesCtrl.createFollowUpSchema),
  followUpsSalesCtrl.createFollowUp
);
router.patch(
  '/follow-ups/:id',
  requireAuth,
  validateBody(followUpsSalesCtrl.updateFollowUpSchema),
  followUpsSalesCtrl.updateFollowUp
);
router.delete('/follow-ups/:id', requireAuth, followUpsSalesCtrl.deleteFollowUp);

router.get('/sales', requireAuth, followUpsSalesCtrl.listSales);
router.post('/sales', requireAuth, validateBody(followUpsSalesCtrl.createSaleSchema), followUpsSalesCtrl.createSale);

// Conversations & Messages
router.get('/conversations', requireAuth, conversationsCtrl.listConversations);
router.get('/conversations/:id', requireAuth, conversationsCtrl.getConversation);
router.patch(
  '/conversations/:id',
  requireAuth,
  validateBody(conversationsCtrl.updateConversationSchema),
  conversationsCtrl.updateConversation
);
router.get('/conversations/:id/messages', requireAuth, conversationsCtrl.listMessages);
router.post(
  '/conversations/:id/messages',
  requireAuth,
  validateBody(conversationsCtrl.sendMessageSchema),
  conversationsCtrl.sendMessage
);

// Templates & Campaigns
router.get('/templates', requireAuth, campaignsCtrl.listTemplates);
router.get('/campaigns', requireAuth, campaignsCtrl.listCampaigns);
router.post('/campaigns', requireAuth, validateBody(campaignsCtrl.createCampaignSchema), campaignsCtrl.createCampaign);
router.get('/campaigns/:id', requireAuth, campaignsCtrl.getCampaign);
router.patch(
  '/campaigns/:id',
  requireAuth,
  validateBody(campaignsCtrl.updateCampaignSchema),
  campaignsCtrl.updateCampaign
);
router.post('/campaigns/:id/validate', requireAuth, campaignsCtrl.validateCampaign);
router.post('/campaigns/:id/launch', requireAuth, campaignsCtrl.launchCampaign);

// Workflows
router.get('/workflows', requireAuth, workflowsCtrl.listWorkflows);
router.post('/workflows', requireAuth, validateBody(workflowsCtrl.workflowSchema), workflowsCtrl.createWorkflow);
router.get('/workflows/:id', requireAuth, workflowsCtrl.getWorkflow);
router.patch(
  '/workflows/:id',
  requireAuth,
  validateBody(workflowsCtrl.updateWorkflowSchema),
  workflowsCtrl.updateWorkflow
);
router.post('/workflows/:id/publish', requireAuth, workflowsCtrl.publishWorkflow);

// Analytics
router.get('/analytics/overview', requireAuth, analyticsBillingAiCtrl.getAnalyticsOverview);
router.get('/analytics/conversations', requireAuth, analyticsBillingAiCtrl.getAnalyticsConversations);
router.get('/analytics/campaigns', requireAuth, analyticsBillingAiCtrl.getAnalyticsCampaigns);

// Billing & Payments
router.get('/billing/subscription', requireAuth, analyticsBillingAiCtrl.getSubscription);
router.get('/billing/usage', requireAuth, analyticsBillingAiCtrl.getUsage);
router.post(
  '/billing/create-order',
  requireAuth,
  validateBody(analyticsBillingAiCtrl.createBillingOrderSchema),
  analyticsBillingAiCtrl.createBillingOrder
);
router.post(
  '/billing/verify-payment',
  requireAuth,
  validateBody(analyticsBillingAiCtrl.verifyBillingPaymentSchema),
  analyticsBillingAiCtrl.verifyBillingPayment
);

// Payment Gateway Settings (Razorpay)
router.get('/settings/payment-gateway', requireAuth, analyticsBillingAiCtrl.getPaymentGatewayConfig);
router.post(
  '/settings/payment-gateway',
  requireAuth,
  requireRole('owner', 'admin'),
  validateBody(analyticsBillingAiCtrl.paymentGatewayConfigSchema),
  analyticsBillingAiCtrl.updatePaymentGatewayConfig
);

// AI Assistant
router.get('/ai/status', requireAuth, analyticsBillingAiCtrl.getAiStatusHandler);
router.post(
  '/ai/reply-suggestions',
  requireAuth,
  validateBody(analyticsBillingAiCtrl.aiConversationSchema),
  analyticsBillingAiCtrl.postAiReplySuggestions
);
router.post(
  '/ai/summarize',
  requireAuth,
  validateBody(analyticsBillingAiCtrl.aiConversationSchema),
  analyticsBillingAiCtrl.postAiSummarize
);
router.post(
  '/ai/campaign-copy',
  requireAuth,
  validateBody(analyticsBillingAiCtrl.aiCampaignCopySchema),
  analyticsBillingAiCtrl.postAiCampaignCopy
);

// Super Admin Platform Management
router.get('/admin/overview', requireAuth, requireSuperAdmin, adminCtrl.getAdminOverview);
router.get('/admin/users', requireAuth, requireSuperAdmin, adminCtrl.listAdminUsers);
router.post(
  '/admin/users',
  requireAuth,
  requireSuperAdmin,
  validateBody(adminCtrl.createAdminUserSchema),
  adminCtrl.createAdminUser
);
router.patch(
  '/admin/users/:id',
  requireAuth,
  requireSuperAdmin,
  validateBody(adminCtrl.updateAdminUserSchema),
  adminCtrl.updateAdminUser
);
router.post('/admin/impersonate', requireAuth, requireSuperAdmin, adminCtrl.impersonateWorkspace);
router.post('/admin/stop-impersonation', requireAuth, requireSuperAdmin, adminCtrl.stopImpersonation);

router.get('/admin/plans', requireAuth, requireSuperAdmin, adminCtrl.listAdminPlans);
router.post(
  '/admin/plans',
  requireAuth,
  requireSuperAdmin,
  validateBody(adminCtrl.createPlanSchema),
  adminCtrl.createAdminPlan
);
router.patch(
  '/admin/plans/:id',
  requireAuth,
  requireSuperAdmin,
  validateBody(adminCtrl.updatePlanSchema),
  adminCtrl.updateAdminPlan
);
router.delete('/admin/plans/:id', requireAuth, requireSuperAdmin, adminCtrl.deleteAdminPlan);

router.get('/admin/subscriptions', requireAuth, requireSuperAdmin, adminCtrl.listAdminSubscriptions);
router.patch(
  '/admin/subscriptions/:id',
  requireAuth,
  requireSuperAdmin,
  validateBody(adminCtrl.updateSubscriptionSchema),
  adminCtrl.updateAdminSubscription
);

// Admin Platform Settings (Payment Gateway Razorpay)
router.get(
  '/admin/settings/payment-gateway',
  requireAuth,
  requireSuperAdmin,
  adminCtrl.getAdminPaymentGateway
);
router.post(
  '/admin/settings/payment-gateway',
  requireAuth,
  requireSuperAdmin,
  validateBody(adminCtrl.adminPaymentGatewaySchema),
  adminCtrl.updateAdminPaymentGateway
);

// Admin Platform Settings (Email SMTP)
router.get(
  '/admin/settings/email-smtp',
  requireAuth,
  requireSuperAdmin,
  adminCtrl.getAdminSmtpSettings
);
router.post(
  '/admin/settings/email-smtp',
  requireAuth,
  requireSuperAdmin,
  validateBody(adminCtrl.adminSmtpSchema),
  adminCtrl.updateAdminSmtpSettings
);
router.post(
  '/admin/settings/email-smtp/test',
  requireAuth,
  requireSuperAdmin,
  validateBody(adminCtrl.adminSendTestEmailSchema),
  adminCtrl.sendAdminTestEmail
);

module.exports = router;
