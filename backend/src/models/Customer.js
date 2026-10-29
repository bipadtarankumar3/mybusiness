'use strict';
const { Model } = require('sequelize');
const cols = require('./_columns');

const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'customer', 'lost'];
const SOURCES = ['whatsapp', 'website', 'walk_in', 'referral', 'manual', 'import'];

module.exports = (sequelize, DataTypes) => {
  const c = cols(DataTypes);
  class Customer extends Model {
    static associate(m) {
      Customer.belongsTo(m.Business, { foreignKey: 'businessId', as: 'business', onDelete: 'CASCADE' });
      Customer.belongsToMany(m.CustomerTag, {
        through: m.CustomerTagMapping,
        foreignKey: 'customerId',
        otherKey: 'tagId',
        as: 'tags',
      });
      Customer.hasMany(m.CustomerTagMapping, { foreignKey: 'customerId', as: 'tagMappings' });
      Customer.hasMany(m.Conversation, { foreignKey: 'customerId', as: 'conversations' });
      Customer.hasMany(m.FollowUpReminder, { foreignKey: 'customerId', as: 'followUps' });
      Customer.hasMany(m.Sale, { foreignKey: 'customerId', as: 'sales' });
    }
  }
  Customer.LEAD_STATUSES = LEAD_STATUSES;
  Customer.SOURCES = SOURCES;
  Customer.init(
    {
      id: c.id(),
      businessId: c.fk(),
      name: { type: DataTypes.STRING(150), allowNull: false },
      phone: { type: DataTypes.STRING(20), allowNull: false },
      email: { type: DataTypes.STRING(191), allowNull: true },
      leadStatus: { type: DataTypes.ENUM(...LEAD_STATUSES), allowNull: false, defaultValue: 'new' },
      source: { type: DataTypes.ENUM(...SOURCES), allowNull: false, defaultValue: 'manual' },
      notes: { type: DataTypes.TEXT, allowNull: true },
      whatsappOptIn: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      optInAt: c.date(),
      optedOutAt: c.date(),
      lastContactedAt: c.date(),
      isDemo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      ...c.timestamps({ deletedAt: true }),
    },
    {
      sequelize,
      modelName: 'Customer',
      tableName: 'customers',
      underscored: true,
      paranoid: true,
      indexes: [
        { unique: true, fields: ['business_id', 'phone'], name: 'customers_business_phone_uq' },
        { fields: ['business_id', 'lead_status'], name: 'customers_business_lead_idx' },
        { fields: ['business_id', 'created_at'], name: 'customers_business_created_idx' },
      ],
    }
  );
  return Customer;
};
