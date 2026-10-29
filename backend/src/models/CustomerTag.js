'use strict';
const { Model } = require('sequelize');
const cols = require('./_columns');

module.exports = (sequelize, DataTypes) => {
  const c = cols(DataTypes);
  class CustomerTag extends Model {
    static associate(m) {
      CustomerTag.belongsTo(m.Business, { foreignKey: 'businessId', as: 'business', onDelete: 'CASCADE' });
      CustomerTag.belongsToMany(m.Customer, {
        through: m.CustomerTagMapping,
        foreignKey: 'tagId',
        otherKey: 'customerId',
        as: 'customers',
      });
      CustomerTag.hasMany(m.CustomerTagMapping, { foreignKey: 'tagId', as: 'mappings' });
    }
  }
  CustomerTag.init(
    {
      id: c.id(),
      businessId: c.fk(),
      name: { type: DataTypes.STRING(60), allowNull: false },
      color: { type: DataTypes.STRING(9), allowNull: false, defaultValue: '#16C784' },
      ...c.timestamps(),
    },
    {
      sequelize,
      modelName: 'CustomerTag',
      tableName: 'customer_tags',
      underscored: true,
      indexes: [{ unique: true, fields: ['business_id', 'name'], name: 'customer_tags_business_name_uq' }],
    }
  );
  return CustomerTag;
};
