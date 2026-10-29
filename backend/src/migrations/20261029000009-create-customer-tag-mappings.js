'use strict';
const { columns } = require('../utils/migrationColumns');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const c = columns(queryInterface, Sequelize);
    await queryInterface.createTable(
      'customer_tag_mappings',
      {
        id: c.id(),
        business_id: c.fk('businesses', 'CASCADE'),
        customer_id: c.fk('customers', 'CASCADE'),
        tag_id: c.fk('customer_tags', 'CASCADE'),
        ...c.timestamps({ updatedAt: false }),
      },
      c.tableOptions
    );
    await queryInterface.addIndex('customer_tag_mappings', ['customer_id', 'tag_id'], { unique: true, name: 'ctm_customer_tag_uq' });
    await queryInterface.addIndex('customer_tag_mappings', ['tag_id'], { name: 'ctm_tag_idx' });
    await queryInterface.addIndex('customer_tag_mappings', ['business_id'], { name: 'ctm_business_idx' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('customer_tag_mappings');
  },
};
