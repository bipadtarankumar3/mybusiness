'use strict';

const crypto = require('crypto');

class WhatsAppCloudProvider {
  constructor({ accessToken, phoneNumberId, apiVersion = 'v21.0' }) {
    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
    this.apiVersion = apiVersion;
    this.mode = 'cloud';
  }

  get endpoint() {
    return `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
  }

  async sendText({ to, body }) {
    const cleanTo = String(to).replace(/^\+/, '');
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanTo,
      type: 'text',
      text: { preview_url: false, body },
    };
    return this._post(payload);
  }

  async sendTemplate({ to, templateName, language = 'en', parameters = [] }) {
    const cleanTo = String(to).replace(/^\+/, '');
    const components =
      parameters.length > 0
        ? [
            {
              type: 'body',
              parameters: parameters.map((val) => ({ type: 'text', text: String(val) })),
            },
          ]
        : [];
    const payload = {
      messaging_product: 'whatsapp',
      to: cleanTo,
      type: 'template',
      template: {
        name: templateName,
        language: { code: language },
        ...(components.length ? { components } : {}),
      },
    };
    return this._post(payload);
  }

  async _post(payload) {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errMsg = json?.error?.message || `Meta Cloud API HTTP ${response.status}`;
        return { accepted: false, status: 'failed', errorMessage: errMsg };
      }
      const providerMessageId = json?.messages?.[0]?.id || null;
      return {
        accepted: true,
        status: 'accepted',
        providerMessageId,
      };
    } catch (err) {
      return {
        accepted: false,
        status: 'failed',
        errorMessage: err.message || 'Network error calling WhatsApp Cloud API',
      };
    }
  }

  static verifySignature(rawBody, signatureHeader, appSecret) {
    if (!appSecret || !signatureHeader || !rawBody) return false;
    const [algo, providedHex] = String(signatureHeader).split('=');
    if (algo !== 'sha256' || !providedHex) return false;
    const expectedHex = crypto
      .createHmac('sha256', appSecret)
      .update(Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody), 'utf8'))
      .digest('hex');
    try {
      const a = Buffer.from(providedHex, 'hex');
      const b = Buffer.from(expectedHex, 'hex');
      if (a.length !== b.length) return false;
      return crypto.timingSafeEqual(a, b);
    } catch (_e) {
      return false;
    }
  }
}

module.exports = WhatsAppCloudProvider;
