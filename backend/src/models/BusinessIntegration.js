'use strict';
const crypto = require('crypto');
const { Model } = require('sequelize');
const cols = require('./_columns');
const { getEnv } = require('../config/env');

function deriveKey() {
  const secret = getEnv().CREDENTIALS_ENCRYPTION_KEY || getEnv().AUTH_SECRET;
  return crypto.createHash('sha256').update(String(secret)).digest();
}

function encryptCredentials(obj) {
  if (!obj) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', deriveKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(obj), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
}

function decryptCredentials(payload) {
  if (!payload) return null;
  const [ivB64, tagB64, dataB64] = String(payload).split('.');
  if (!ivB64 || !tagB64 || !dataB64) return null;
  const decipher = crypto.createDecipheriv('aes-256-gcm', deriveKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}

module.exports = (sequelize, DataTypes) => {
  const c = cols(DataTypes);
  class BusinessIntegration extends Model {
    static associate(m) {
      BusinessIntegration.belongsTo(m.Business, { foreignKey: 'businessId', as: 'business', onDelete: 'CASCADE' });
    }

    setCredentials(obj) {
      this.setDataValue('credentialsEncrypted', encryptCredentials(obj));
    }

    getCredentials() {
      return decryptCredentials(this.getDataValue('credentialsEncrypted'));
    }

    toJSON() {
      const v = { ...this.get() };
      delete v.credentialsEncrypted;
      return v;
    }
  }
  BusinessIntegration.encryptCredentials = encryptCredentials;
  BusinessIntegration.decryptCredentials = decryptCredentials;
  BusinessIntegration.init(
    {
      id: c.id(),
      businessId: c.fk(),
      provider: { type: DataTypes.STRING(40), allowNull: false },
      status: { type: DataTypes.ENUM('not_configured', 'configured', 'error'), allowNull: false, defaultValue: 'not_configured' },
      externalAccountId: { type: DataTypes.STRING(64), allowNull: true },
      credentialsEncrypted: { type: DataTypes.TEXT, allowNull: true },
      config: { type: DataTypes.JSON, allowNull: true },
      lastError: { type: DataTypes.STRING(500), allowNull: true },
      ...c.timestamps(),
    },
    {
      sequelize,
      modelName: 'BusinessIntegration',
      tableName: 'business_integrations',
      underscored: true,
      indexes: [
        { unique: true, fields: ['business_id', 'provider'], name: 'bi_business_provider_uq' },
        { fields: ['provider', 'external_account_id'], name: 'bi_provider_external_idx' },
      ],
    }
  );
  return BusinessIntegration;
};
