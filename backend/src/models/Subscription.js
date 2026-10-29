'use strict';
const { Model } = require('sequelize');
const cols = require('./_columns');

module.exports = (sequelize, DataTypes) => {
  const c = cols(DataTypes);
  class Subscription extends Model {
    static associate(m) {
      Subscription.belongsTo(m.Business, { foreignKey: 'businessId', as: 'business', onDelete: 'CASCADE' });
      Subscription.belongsTo(m.Plan, { foreignKey: 'planId', as: 'plan', onDelete: 'RESTRICT' });
    }
  }
  Subscription.init(
    {
      id: c.id(),
      businessId: c.fk(),
      planId: c.fk(),
      status: { type: DataTypes.ENUM('trialing', 'active', 'past_due', 'cancelled'), allowNull: false, defaultValue: 'active' },
      billingCycle: { type: DataTypes.ENUM('monthly', 'yearly'), allowNull: false, defaultValue: 'monthly' },
      currentPeriodStart: c.date(),
      currentPeriodEnd: c.date(),
      cancelledAt: c.date(),
      ...c.timestamps(),
    },
    {
      sequelize,
      modelName: 'Subscription',
      tableName: 'subscriptions',
      underscored: true,
      indexes: [
        { unique: true, fields: ['business_id'], name: 'subscriptions_business_uq' },
        { fields: ['plan_id'], name: 'subscriptions_plan_idx' },
      ],
    }
  );
  return Subscription;
};
