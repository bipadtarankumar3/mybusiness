'use strict';
const { Model } = require('sequelize');
const cols = require('./_columns');

module.exports = (sequelize, DataTypes) => {
  const c = cols(DataTypes);
  class FollowUpReminder extends Model {
    static associate(m) {
      FollowUpReminder.belongsTo(m.Business, { foreignKey: 'businessId', as: 'business', onDelete: 'CASCADE' });
      FollowUpReminder.belongsTo(m.Customer, { foreignKey: 'customerId', as: 'customer', onDelete: 'CASCADE' });
      FollowUpReminder.belongsTo(m.User, { foreignKey: 'assignedToUserId', as: 'assignedTo', onDelete: 'SET NULL' });
      FollowUpReminder.belongsTo(m.User, { foreignKey: 'createdByUserId', as: 'createdBy', onDelete: 'SET NULL' });
    }
  }
  FollowUpReminder.init(
    {
      id: c.id(),
      businessId: c.fk(),
      customerId: c.fk(),
      assignedToUserId: c.fk(true),
      createdByUserId: c.fk(true),
      title: { type: DataTypes.STRING(200), allowNull: false },
      notes: { type: DataTypes.TEXT, allowNull: true },
      dueAt: c.date(false),
      status: { type: DataTypes.ENUM('pending', 'completed', 'cancelled'), allowNull: false, defaultValue: 'pending' },
      completedAt: c.date(),
      ...c.timestamps(),
    },
    {
      sequelize,
      modelName: 'FollowUpReminder',
      tableName: 'follow_up_reminders',
      underscored: true,
      indexes: [
        { fields: ['business_id', 'status', 'due_at'], name: 'fur_business_status_due_idx' },
        { fields: ['customer_id'], name: 'fur_customer_idx' },
      ],
    }
  );
  return FollowUpReminder;
};
