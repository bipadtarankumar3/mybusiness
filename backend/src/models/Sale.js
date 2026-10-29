'use strict';
const { Model } = require('sequelize');
const cols = require('./_columns');

module.exports = (sequelize, DataTypes) => {
  const c = cols(DataTypes);
  class Sale extends Model {
    static associate(m) {
      Sale.belongsTo(m.Business, { foreignKey: 'businessId', as: 'business', onDelete: 'CASCADE' });
      Sale.belongsTo(m.Customer, { foreignKey: 'customerId', as: 'customer', onDelete: 'CASCADE' });
      Sale.belongsTo(m.User, { foreignKey: 'recordedByUserId', as: 'recordedBy', onDelete: 'SET NULL' });
    }
  }
  Sale.init(
    {
      id: c.id(),
      businessId: c.fk(),
      customerId: c.fk(),
      recordedByUserId: c.fk(true),
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        get: cols.decimalGetter('amount'),
      },
      currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'INR' },
      note: { type: DataTypes.STRING(255), allowNull: true },
      recordedAt: c.date(false),
      isDemo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      ...c.timestamps(),
    },
    {
      sequelize,
      modelName: 'Sale',
      tableName: 'sales',
      underscored: true,
      indexes: [
        { fields: ['business_id', 'recorded_at'], name: 'sales_business_recorded_idx' },
        { fields: ['customer_id'], name: 'sales_customer_idx' },
      ],
    }
  );
  return Sale;
};
