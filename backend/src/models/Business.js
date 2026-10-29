'use strict';
const { Model } = require('sequelize');
const cols = require('./_columns');

module.exports = (sequelize, DataTypes) => {
  const c = cols(DataTypes);
  class Business extends Model {
    static associate(m) {
      Business.hasMany(m.BusinessMember, { foreignKey: 'businessId', as: 'members' });
      Business.hasOne(m.Subscription, { foreignKey: 'businessId', as: 'subscription' });
      Business.hasMany(m.Customer, { foreignKey: 'businessId', as: 'customers' });
      Business.hasMany(m.Team, { foreignKey: 'businessId', as: 'teams' });
      Business.hasMany(m.BusinessIntegration, { foreignKey: 'businessId', as: 'integrations' });
    }
  }
  Business.init(
    {
      id: c.id(),
      name: { type: DataTypes.STRING(150), allowNull: false },
      slug: { type: DataTypes.STRING(160), allowNull: false },
      industry: { type: DataTypes.STRING(80), allowNull: true },
      timezone: { type: DataTypes.STRING(64), allowNull: false, defaultValue: 'Asia/Kolkata' },
      phone: { type: DataTypes.STRING(32), allowNull: true },
      website: { type: DataTypes.STRING(255), allowNull: true },
      businessHours: { type: DataTypes.JSON, allowNull: true },
      aiKnowledge: { type: DataTypes.TEXT, allowNull: true },
      isDemo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      ...c.timestamps(),
    },
    {
      sequelize,
      modelName: 'Business',
      tableName: 'businesses',
      underscored: true,
      indexes: [{ unique: true, fields: ['slug'], name: 'businesses_slug_uq' }],
    }
  );
  return Business;
};
