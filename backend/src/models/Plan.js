'use strict';
const { Model } = require('sequelize');
const cols = require('./_columns');

module.exports = (sequelize, DataTypes) => {
  const c = cols(DataTypes);
  class Plan extends Model {
    static associate(m) {
      Plan.hasMany(m.Subscription, { foreignKey: 'planId', as: 'subscriptions' });
    }
  }
  Plan.init(
    {
      id: c.id(),
      code: { type: DataTypes.STRING(40), allowNull: false },
      name: { type: DataTypes.STRING(80), allowNull: false },
      description: { type: DataTypes.STRING(255), allowNull: true },
      priceMonthly: { type: DataTypes.DECIMAL(10, 2), allowNull: true, get: cols.decimalGetter('priceMonthly') },
      priceYearly: { type: DataTypes.DECIMAL(10, 2), allowNull: true, get: cols.decimalGetter('priceYearly') },
      currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'INR' },
      limits: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
      features: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      isPublic: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      ...c.timestamps(),
    },
    {
      sequelize,
      modelName: 'Plan',
      tableName: 'plans',
      underscored: true,
      indexes: [{ unique: true, fields: ['code'], name: 'plans_code_uq' }],
    }
  );
  return Plan;
};
