'use strict';
const { Model } = require('sequelize');
const cols = require('./_columns');

const STATUSES = ['simulated', 'queued', 'accepted', 'sent', 'delivered', 'read', 'failed', 'received'];

module.exports = (sequelize, DataTypes) => {
  const c = cols(DataTypes);
  class Message extends Model {
    static associate(m) {
      Message.belongsTo(m.Business, { foreignKey: 'businessId', as: 'business', onDelete: 'CASCADE' });
      Message.belongsTo(m.Conversation, { foreignKey: 'conversationId', as: 'conversation', onDelete: 'CASCADE' });
      Message.belongsTo(m.MessageTemplate, { foreignKey: 'templateId', as: 'template', onDelete: 'SET NULL' });
      Message.belongsTo(m.User, { foreignKey: 'sentByUserId', as: 'sentBy', onDelete: 'SET NULL' });
    }
  }
  Message.STATUSES = STATUSES;
  Message.init(
    {
      id: c.id(),
      businessId: c.fk(),
      conversationId: c.fk(),
      templateId: c.fk(true),
      sentByUserId: c.fk(true),
      direction: { type: DataTypes.ENUM('inbound', 'outbound'), allowNull: false },
      type: { type: DataTypes.ENUM('text', 'template', 'note'), allowNull: false, defaultValue: 'text' },
      body: { type: DataTypes.TEXT, allowNull: true },
      status: { type: DataTypes.ENUM(...STATUSES), allowNull: false },
      providerMessageId: { type: DataTypes.STRING(128), allowNull: true },
      errorMessage: { type: DataTypes.STRING(500), allowNull: true },
      statusUpdatedAt: c.date(),
      metadata: { type: DataTypes.JSON, allowNull: true },
      ...c.timestamps(),
    },
    {
      sequelize,
      modelName: 'Message',
      tableName: 'messages',
      underscored: true,
      indexes: [
        { unique: true, fields: ['provider_message_id'], name: 'messages_provider_msg_uq' },
        { fields: ['conversation_id', 'created_at'], name: 'messages_conv_created_idx' },
        { fields: ['business_id', 'created_at'], name: 'messages_business_created_idx' },
      ],
    }
  );
  return Message;
};
