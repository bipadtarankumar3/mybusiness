'use strict';
const { columns } = require('../utils/migrationColumns');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const c = columns(queryInterface, Sequelize);
    await queryInterface.createTable(
      'customers',
      {
        id: c.id(),
        business_id: c.fk('businesses', 'CASCADE'),
        name: { type: Sequelize.STRING(150), allowNull: false },
        phone: { type: Sequelize.STRING(20), allowNull: false },
        email: { type: Sequelize.STRING(191), allowNull: true },
        lead_status: {
          type: Sequelize.ENUM('new', 'contacted', 'qualified', 'customer', 'lost'),
          allowNull: false,
          defaultValue: 'new',
        },
        source: {
          type: Sequelize.ENUM('whatsapp', 'website', 'walk_in', 'referral', 'manual', 'import'),
          allowNull: false,
          defaultValue: 'manual',
        },
        notes: { type: Sequelize.TEXT, allowNull: true },
        whatsapp_opt_in: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        opt_in_at: c.date(),
        opted_out_at: c.date(),
        last_contacted_at: c.date(),
        is_demo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        ...c.timestamps({ deletedAt: true }),
      },
      c.tableOptions
    );
    await queryInterface.addIndex('customers', ['business_id', 'phone'], { unique: true, name: 'customers_business_phone_uq' });
    await queryInterface.addIndex('customers', ['business_id', 'lead_status'], { name: 'customers_business_lead_idx' });
    await queryInterface.addIndex('customers', ['business_id', 'created_at'], { name: 'customers_business_created_idx' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('customers');
  },
};
