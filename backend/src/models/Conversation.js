'use strict';
const { Model } = require('sequelize');
const cols = require('./_columns');

module.exports = (sequelize, DataTypes) => {
  const c = cols(DataTypes);
  class Conversation extends Model {
    static associate(m) {
      Conversation.belongsTo(m.Business, { foreignKey: 'businessId', as: 'business', onDelete: 'CASCADE' });
      Conversation.belongsTo(m.Customer, { foreignKey: 'customerId', as: 'customer', onDelete: 'CASCADE' });
      Conversation.belongsTo(m.User, { foreignKey: 'assignedToUserId', as: 'assignedTo', onDelete: 'SET NULL' });
      Conversation.hasMany(m.Message, { foreignKey: 'conversationId', as: 'messages' });
    }
  }
  Conversation.init(
    {
      id: c.id(),
      businessId: c.fk(),
      customerId: c.fk(),
      assignedToUserId: c.fk(true),
      channel: { type: DataTypes.ENUM('whatsapp'), allowNull: false, defaultValue: 'whatsapp' },
      status: { type: DataTypes.ENUM('open', 'pending', 'resolved'), allowNull: false, defaultValue: 'open' },
      isDemo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      unreadCount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      lastMessageAt: c.date(),
      lastMessagePreview: { type: DataTypes.STRING(255), allowNull: true },
      lastInboundAt: c.date(),
      ...c.timestamps(),
    },
    {
      sequelize,
      modelName: 'Conversation',
      tableName: 'conversations',
      underscored: true,
      indexes: [
        { fields: ['business_id', 'status', 'last_message_at'], name: 'conv_business_status_last_idx' },
        { fields: ['customer_id'], name: 'conv_customer_idx' },
        { fields: ['assigned_to_user_id'], name: 'conv_assignee_idx' },
      ],
    }
  );
  return Conversation;
};
