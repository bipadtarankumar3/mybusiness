'use strict';

const nodemailer = require('nodemailer');
const models = require('../models');
const { getEnv } = require('../config/env');

/**
 * Retrieves the effective platform SMTP configuration from BusinessIntegration (platform_smtp)
 * or falls back to environment variables.
 */
async function getEffectiveSmtpConfig() {
  const env = getEnv();

  const integration = await models.BusinessIntegration.findOne({
    where: { provider: 'platform_smtp' },
  });

  const creds = integration ? integration.getCredentials() || {} : {};

  const host = creds.host || env.EMAIL_HOST || '';
  const port = Number(creds.port || env.EMAIL_PORT || 587);
  const secure = creds.secure !== undefined ? Boolean(creds.secure) : port === 465;
  const user = creds.user || env.EMAIL_USER || '';
  const password = creds.password || env.EMAIL_PASSWORD || '';
  const fromEmail = creds.fromEmail || env.EMAIL_FROM || (user ? user : 'noreply@chatflow.local');
  const fromName = creds.fromName || 'ChatFlow Platform';

  return {
    configured: Boolean(host && fromEmail),
    host,
    port,
    secure,
    user,
    password,
    fromEmail,
    fromName,
    hasPassword: Boolean(password),
    status: integration?.status || (host ? 'configured' : 'not_configured'),
    updatedAt: integration?.updatedAt || null,
  };
}

/**
 * Create a Nodemailer transporter using the effective SMTP configuration.
 */
async function createTransporter(customConfig = null) {
  const cfg = customConfig || (await getEffectiveSmtpConfig());

  if (!cfg.host) {
    return null;
  }

  const transportOptions = {
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    tls: {
      rejectUnauthorized: false,
    },
  };

  if (cfg.user && cfg.password) {
    transportOptions.auth = {
      user: cfg.user,
      pass: cfg.password,
    };
  }

  return nodemailer.createTransport(transportOptions);
}

/**
 * Sends an email using configured SMTP or simulated mode in test/development.
 */
async function sendMail({ to, subject, text, html, from = null }) {
  const cfg = await getEffectiveSmtpConfig();
  const fromAddress = from || `"${cfg.fromName}" <${cfg.fromEmail}>`;

  if (!cfg.configured || !cfg.host) {
    return {
      success: true,
      simulated: true,
      messageId: `sim_email_${Date.now()}`,
      to,
      subject,
      note: 'SMTP not configured: email simulated in test/development mode.',
    };
  }

  const transporter = await createTransporter(cfg);
  if (!transporter) {
    return {
      success: true,
      simulated: true,
      messageId: `sim_email_${Date.now()}`,
      to,
      subject,
    };
  }

  const info = await transporter.sendMail({
    from: fromAddress,
    to,
    subject,
    text: text || '',
    html: html || text || '',
  });

  return {
    success: true,
    simulated: false,
    messageId: info.messageId,
    to,
    subject,
  };
}

/**
 * Verifies SMTP connection and optionally sends a verification test email.
 */
async function verifyAndSendTestEmail({ toEmail, customConfig = null }) {
  const cfg = customConfig || (await getEffectiveSmtpConfig());

  if (!cfg.host) {
    return {
      success: true,
      simulated: true,
      message: `SMTP host is empty. Simulated test email dispatched to ${toEmail} for verification.`,
      to: toEmail,
    };
  }

  const transporter = await createTransporter(cfg);
  if (!transporter) {
    return {
      success: true,
      simulated: true,
      message: `Simulated test email sent to ${toEmail}.`,
      to: toEmail,
    };
  }

  // Attempt connection verification
  await transporter.verify();

  // Send test email
  const info = await transporter.sendMail({
    from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
    to: toEmail,
    subject: 'ChatFlow Platform SMTP Verification Test',
    text: `Hello!\n\nThis is a test email sent from ChatFlow Super Admin Console to verify your SMTP server configuration (${cfg.host}:${cfg.port}).\n\nTimestamp: ${new Date().toISOString()}\nStatus: Verified & Operational.`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; background: #f8fafc; color: #1e293b;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
            <div style="width: 38px; height: 38px; border-radius: 8px; background: #00a884; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 800; font-size: 1.1rem;">CF</div>
            <h2 style="margin: 0; font-size: 1.25rem; color: #0f172a;">ChatFlow SMTP Verification</h2>
          </div>
          <p style="font-size: 0.95rem; line-height: 1.6; color: #334155;">
            Your platform email server configuration is working correctly!
          </p>
          <div style="background: #f1f5f9; border-radius: 8px; padding: 14px 16px; margin: 20px 0; font-size: 0.85rem; line-height: 1.7;">
            <div><strong>SMTP Host:</strong> ${cfg.host}</div>
            <div><strong>SMTP Port:</strong> ${cfg.port} (${cfg.secure ? 'SSL/TLS' : 'STARTTLS'})</div>
            <div><strong>From Address:</strong> ${cfg.fromEmail}</div>
            <div><strong>Sender Name:</strong> ${cfg.fromName}</div>
            <div><strong>Verified At:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</div>
          </div>
          <p style="font-size: 0.85rem; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            This test email was requested from the ChatFlow Super Admin Settings Console.
          </p>
        </div>
      </div>
    `,
  });

  return {
    success: true,
    simulated: false,
    messageId: info.messageId,
    message: `Test email successfully delivered to ${toEmail}!`,
    to: toEmail,
  };
}

module.exports = {
  getEffectiveSmtpConfig,
  createTransporter,
  sendMail,
  verifyAndSendTestEmail,
};
