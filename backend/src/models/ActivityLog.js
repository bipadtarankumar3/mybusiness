'use strict';
const { Model } = require('sequelize');
const cols = require('./_columns');

module.exports = (sequelize, DataTypes) => {
  const c = cols(DataTypes);
  class ActivityLog extends Model {
    static associate(m) {
      ActivityLog.belongsTo(m.Business, { foreignKey: 'businessId', as: 'business', onDelete: 'CASCADE' });
      ActivityLog.belongsTo(m.User, { foreignKey: 'actorUserId', as: 'actor', onDelete: 'SET NULL' });
    }
  }
  ActivityLog.init(
    {
      id: c.id(),
      businessId: c.fk(),
      actorUserId: c.fk(true),
      type: { type: DataTypes.STRING(60), allowNull: false },
      description: { type: DataTypes.STRING(500), allowNull: false },
      entityType: { type: DataTypes.STRING(40), allowNull: true },
      entityId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      metadata: { type: DataTypes.JSON, allowNull: true },
      ...c.timestamps({ updatedAt: false }),
    },
    {
      sequelize,
      modelName: 'ActivityLog',
      tableName: 'activity_logs',
      underscored: true,
      updatedAt: false,
      indexes: [{ fields: ['business_id', 'created_at'], name: 'activity_business_created_idx' }],
    }
  );
  return ActivityLog;
};
