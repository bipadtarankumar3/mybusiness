'use strict';
const { Model } = require('sequelize');
const cols = require('./_columns');

module.exports = (sequelize, DataTypes) => {
  const c = cols(DataTypes);
  class MessageTemplate extends Model {
    static associate(m) {
      MessageTemplate.belongsTo(m.Business, { foreignKey: 'businessId', as: 'business', onDelete: 'CASCADE' });
      MessageTemplate.hasMany(m.Campaign, { foreignKey: 'templateId', as: 'campaigns' });
    }
  }
  MessageTemplate.init(
    {
      id: c.id(),
      businessId: c.fk(),
      name: { type: DataTypes.STRING(120), allowNull: false },
      category: { type: DataTypes.ENUM('marketing', 'utility', 'authentication'), allowNull: false, defaultValue: 'marketing' },
      language: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'en' },
      body: { type: DataTypes.TEXT, allowNull: false },
      variables: { type: DataTypes.JSON, allowNull: true },
      status: { type: DataTypes.ENUM('approved', 'pending', 'rejected', 'draft'), allowNull: false, defaultValue: 'draft' },
      providerTemplateId: { type: DataTypes.STRING(128), allowNull: true },
      isDemo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      ...c.timestamps(),
    },
    {
      sequelize,
      modelName: 'MessageTemplate',
      tableName: 'message_templates',
      underscored: true,
      indexes: [{ unique: true, fields: ['business_id', 'name', 'language'], name: 'mt_business_name_lang_uq' }],
    }
  );
  return MessageTemplate;
};
