'use strict';
const { columns } = require('../utils/migrationColumns');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const c = columns(queryInterface, Sequelize);
    await queryInterface.createTable(
      'businesses',
      {
        id: c.id(),
        name: { type: Sequelize.STRING(150), allowNull: false },
        slug: { type: Sequelize.STRING(160), allowNull: false },
        industry: { type: Sequelize.STRING(80), allowNull: true },
        timezone: { type: Sequelize.STRING(64), allowNull: false, defaultValue: 'Asia/Kolkata' },
        phone: { type: Sequelize.STRING(32), allowNull: true },
        website: { type: Sequelize.STRING(255), allowNull: true },
        business_hours: { type: Sequelize.JSON, allowNull: true },
        ai_knowledge: { type: Sequelize.TEXT, allowNull: true },
        is_demo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        ...c.timestamps(),
      },
      c.tableOptions
    );
    await queryInterface.addIndex('businesses', ['slug'], { unique: true, name: 'businesses_slug_uq' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('businesses');
  },
};
