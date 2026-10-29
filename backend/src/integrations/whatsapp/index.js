'use strict';

const { getEnv } = require('../../config/env');
const models = require('../../models');
const WhatsAppCloudProvider = require('./WhatsAppCloudProvider');
const DemoProvider = require('./DemoProvider');

async function resolveWhatsAppConfig(businessId) {
  const env = getEnv();
  if (businessId) {
    const integration = await models.BusinessIntegration.findOne({
      where: { businessId, provider: 'whatsapp_cloud' },
    });
    if (integration && integration.status === 'configured') {
      const creds = integration.getCredentials();
      if (creds && creds.accessToken && creds.phoneNumberId) {
        return {
          configured: true,
          source: 'business',
          accessToken: creds.accessToken,
          phoneNumberId: creds.phoneNumberId,
          businessAccountId: creds.businessAccountId || env.WHATSAPP_BUSINESS_ACCOUNT_ID || null,
          apiVersion: env.WHATSAPP_API_VERSION || 'v21.0',
          integration,
        };
      }
    }
  }

  if (env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID) {
    return {
      configured: true,
      source: 'env',
      accessToken: env.WHATSAPP_ACCESS_TOKEN,
      phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
      businessAccountId: env.WHATSAPP_BUSINESS_ACCOUNT_ID || null,
      apiVersion: env.WHATSAPP_API_VERSION || 'v21.0',
      integration: null,
    };
  }

  return {
    configured: false,
    source: null,
    integration: null,
  };
}

async function getWhatsAppProvider(businessId) {
  const cfg = await resolveWhatsAppConfig(businessId);
  if (cfg.configured) {
    return new WhatsAppCloudProvider({
      accessToken: cfg.accessToken,
      phoneNumberId: cfg.phoneNumberId,
      apiVersion: cfg.apiVersion,
    });
  }
  return new DemoProvider();
}

module.exports = {
  WhatsAppCloudProvider,
  DemoProvider,
  resolveWhatsAppConfig,
  getWhatsAppProvider,
};
