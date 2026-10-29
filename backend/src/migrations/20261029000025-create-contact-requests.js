'use strict';
const { columns } = require('../utils/migrationColumns');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const c = columns(queryInterface, Sequelize);
    await queryInterface.createTable(
      'contact_requests',
      {
        id: c.id(),
        name: { type: Sequelize.STRING(120), allowNull: false },
        email: { type: Sequelize.STRING(191), allowNull: false },
        phone: { type: Sequelize.STRING(20), allowNull: true },
        business_name: { type: Sequelize.STRING(150), allowNull: true },
        message: { type: Sequelize.TEXT, allowNull: false },
        status: { type: Sequelize.ENUM('new', 'contacted', 'closed'), allowNull: false, defaultValue: 'new' },
        ...c.timestamps(),
      },
      c.tableOptions
    );
    await queryInterface.addIndex('contact_requests', ['created_at'], { name: 'contact_requests_created_idx' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('contact_requests');
  },
};
