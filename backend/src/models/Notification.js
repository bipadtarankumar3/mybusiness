'use strict';
const { Model } = require('sequelize');
const cols = require('./_columns');

module.exports = (sequelize, DataTypes) => {
  const c = cols(DataTypes);
  class Notification extends Model {
    static associate(m) {
      Notification.belongsTo(m.Business, { foreignKey: 'businessId', as: 'business', onDelete: 'CASCADE' });
      Notification.belongsTo(m.User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
    }
  }
  Notification.init(
    {
      id: c.id(),
      businessId: c.fk(),
      userId: c.fk(true),
      type: { type: DataTypes.STRING(60), allowNull: false },
      title: { type: DataTypes.STRING(200), allowNull: false },
      body: { type: DataTypes.STRING(500), allowNull: true },
      data: { type: DataTypes.JSON, allowNull: true },
      readAt: c.date(),
      ...c.timestamps(),
    },
    {
      sequelize,
      modelName: 'Notification',
      tableName: 'notifications',
      underscored: true,
      indexes: [{ fields: ['business_id', 'user_id', 'read_at'], name: 'notifications_business_user_read_idx' }],
    }
  );
  return Notification;
};
