'use strict';
const { Model } = require('sequelize');
const cols = require('./_columns');

module.exports = (sequelize, DataTypes) => {
  const c = cols(DataTypes);
  class UsageRecord extends Model {
    static associate(m) {
      UsageRecord.belongsTo(m.Business, { foreignKey: 'businessId', as: 'business', onDelete: 'CASCADE' });
    }
  }
  UsageRecord.init(
    {
      id: c.id(),
      businessId: c.fk(),
      metric: { type: DataTypes.STRING(40), allowNull: false },
      quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
      unitCost: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: false,
        defaultValue: 0,
        get: cols.decimalGetter('unitCost', 4),
      },
      periodStart: { type: DataTypes.DATEONLY, allowNull: false },
      referenceType: { type: DataTypes.STRING(40), allowNull: true },
      referenceId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      ...c.timestamps({ updatedAt: false }),
    },
    {
      sequelize,
      modelName: 'UsageRecord',
      tableName: 'usage_records',
      underscored: true,
      updatedAt: false,
      indexes: [{ fields: ['business_id', 'metric', 'period_start'], name: 'usage_business_metric_period_idx' }],
    }
  );
  return UsageRecord;
};
