'use strict';
const { Model } = require('sequelize');
const cols = require('./_columns');

module.exports = (sequelize, DataTypes) => {
  const c = cols(DataTypes);
  class CampaignRecipient extends Model {
    static associate(m) {
      CampaignRecipient.belongsTo(m.Business, { foreignKey: 'businessId', as: 'business', onDelete: 'CASCADE' });
      CampaignRecipient.belongsTo(m.Campaign, { foreignKey: 'campaignId', as: 'campaign', onDelete: 'CASCADE' });
      CampaignRecipient.belongsTo(m.Customer, { foreignKey: 'customerId', as: 'customer', onDelete: 'CASCADE' });
      CampaignRecipient.belongsTo(m.Message, { foreignKey: 'messageId', as: 'message', onDelete: 'SET NULL' });
    }
  }
  CampaignRecipient.init(
    {
      id: c.id(),
      businessId: c.fk(),
      campaignId: c.fk(),
      customerId: c.fk(),
      messageId: c.fk(true),
      phone: { type: DataTypes.STRING(20), allowNull: false },
      status: {
        type: DataTypes.ENUM('queued', 'accepted', 'sent', 'delivered', 'read', 'failed', 'skipped'),
        allowNull: false,
        defaultValue: 'queued',
      },
      errorMessage: { type: DataTypes.STRING(500), allowNull: true },
      ...c.timestamps(),
    },
    {
      sequelize,
      modelName: 'CampaignRecipient',
      tableName: 'campaign_recipients',
      underscored: true,
      indexes: [
        { unique: true, fields: ['campaign_id', 'customer_id'], name: 'cr_campaign_customer_uq' },
        { fields: ['campaign_id', 'status'], name: 'cr_campaign_status_idx' },
        { fields: ['customer_id'], name: 'cr_customer_idx' },
        { fields: ['message_id'], name: 'cr_message_idx' },
      ],
    }
  );
  return CampaignRecipient;
};
