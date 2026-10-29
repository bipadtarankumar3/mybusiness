'use strict';
const { Model } = require('sequelize');
const cols = require('./_columns');

module.exports = (sequelize, DataTypes) => {
  const c = cols(DataTypes);
  class ContactRequest extends Model {
    static associate() {}
  }
  ContactRequest.init(
    {
      id: c.id(),
      name: { type: DataTypes.STRING(120), allowNull: false },
      email: { type: DataTypes.STRING(191), allowNull: false },
      phone: { type: DataTypes.STRING(20), allowNull: true },
      businessName: { type: DataTypes.STRING(150), allowNull: true },
      message: { type: DataTypes.TEXT, allowNull: false },
      status: { type: DataTypes.ENUM('new', 'contacted', 'closed'), allowNull: false, defaultValue: 'new' },
      ...c.timestamps(),
    },
    {
      sequelize,
      modelName: 'ContactRequest',
      tableName: 'contact_requests',
      underscored: true,
      indexes: [{ fields: ['created_at'], name: 'contact_requests_created_idx' }],
    }
  );
  return ContactRequest;
};
