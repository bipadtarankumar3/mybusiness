'use strict';
const { Model } = require('sequelize');
const cols = require('./_columns');

module.exports = (sequelize, DataTypes) => {
  const c = cols(DataTypes);
  class WebhookEvent extends Model {
    static associate(m) {
      WebhookEvent.belongsTo(m.Business, { foreignKey: 'businessId', as: 'business', onDelete: 'SET NULL' });
    }
  }
  WebhookEvent.init(
    {
      id: c.id(),
      businessId: c.fk(true),
      provider: { type: DataTypes.STRING(40), allowNull: false },
      eventId: { type: DataTypes.STRING(191), allowNull: false },
      eventType: { type: DataTypes.STRING(40), allowNull: false },
      processedAt: c.date(),
      ...c.timestamps({ updatedAt: false }),
    },
    {
      sequelize,
      modelName: 'WebhookEvent',
      tableName: 'webhook_events',
      underscored: true,
      updatedAt: false,
      indexes: [{ unique: true, fields: ['provider', 'event_id'], name: 'webhook_provider_event_uq' }],
    }
  );
  return WebhookEvent;
};
