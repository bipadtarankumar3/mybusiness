'use strict';
const { columns } = require('../utils/migrationColumns');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const c = columns(queryInterface, Sequelize);
    await queryInterface.createTable(
      'plans',
      {
        id: c.id(),
        code: { type: Sequelize.STRING(40), allowNull: false },
        name: { type: Sequelize.STRING(80), allowNull: false },
        description: { type: Sequelize.STRING(255), allowNull: true },
        price_monthly: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
        price_yearly: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
        currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'INR' },
        limits: { type: Sequelize.JSON, allowNull: false },
        features: { type: Sequelize.JSON, allowNull: false },
        is_public: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        ...c.timestamps(),
      },
      c.tableOptions
    );
    await queryInterface.addIndex('plans', ['code'], { unique: true, name: 'plans_code_uq' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('plans');
  },
};
