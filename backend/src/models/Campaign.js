'use strict';
const { Model } = require('sequelize');
const cols = require('./_columns');

module.exports = (sequelize, DataTypes) => {
  const c = cols(DataTypes);
  class Campaign extends Model {
    static associate(m) {
      Campaign.belongsTo(m.Business, { foreignKey: 'businessId', as: 'business', onDelete: 'CASCADE' });
      Campaign.belongsTo(m.MessageTemplate, { foreignKey: 'templateId', as: 'template', onDelete: 'SET NULL' });
      Campaign.belongsTo(m.User, { foreignKey: 'createdByUserId', as: 'createdBy', onDelete: 'SET NULL' });
      Campaign.hasMany(m.CampaignRecipient, { foreignKey: 'campaignId', as: 'recipients' });
    }
  }
  Campaign.init(
    {
      id: c.id(),
      businessId: c.fk(),
      templateId: c.fk(true),
      createdByUserId: c.fk(true),
      name: { type: DataTypes.STRING(150), allowNull: false },
      status: {
        type: DataTypes.ENUM('draft', 'scheduled', 'sending', 'completed', 'failed', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft',
      },
      audience: { type: DataTypes.JSON, allowNull: true },
      scheduledAt: c.date(),
      startedAt: c.date(),
      completedAt: c.date(),
      estimatedRecipients: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      estimatedCost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        get: cols.decimalGetter('estimatedCost'),
      },
      demoStats: { type: DataTypes.JSON, allowNull: true },
      isDemo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      ...c.timestamps(),
    },
    {
      sequelize,
      modelName: 'Campaign',
      tableName: 'campaigns',
      underscored: true,
      indexes: [{ fields: ['business_id', 'status'], name: 'campaigns_business_status_idx' }],
    }
  );
  return Campaign;
};
