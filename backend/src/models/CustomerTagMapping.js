'use strict';
const { Model } = require('sequelize');
const cols = require('./_columns');

module.exports = (sequelize, DataTypes) => {
  const c = cols(DataTypes);
  class CustomerTagMapping extends Model {
    static associate(m) {
      CustomerTagMapping.belongsTo(m.Business, { foreignKey: 'businessId', as: 'business', onDelete: 'CASCADE' });
      CustomerTagMapping.belongsTo(m.Customer, { foreignKey: 'customerId', as: 'customer', onDelete: 'CASCADE' });
      CustomerTagMapping.belongsTo(m.CustomerTag, { foreignKey: 'tagId', as: 'tag', onDelete: 'CASCADE' });
    }
  }
  CustomerTagMapping.init(
    {
      id: c.id(),
      businessId: c.fk(),
      customerId: c.fk(),
      tagId: c.fk(),
      ...c.timestamps({ updatedAt: false }),
    },
    {
      sequelize,
      modelName: 'CustomerTagMapping',
      tableName: 'customer_tag_mappings',
      underscored: true,
      updatedAt: false,
      indexes: [
        { unique: true, fields: ['customer_id', 'tag_id'], name: 'ctm_customer_tag_uq' },
        { fields: ['tag_id'], name: 'ctm_tag_idx' },
        { fields: ['business_id'], name: 'ctm_business_idx' },
      ],
    }
  );
  return CustomerTagMapping;
};
