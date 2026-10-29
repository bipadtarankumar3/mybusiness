'use strict';
const { columns } = require('../utils/migrationColumns');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const c = columns(queryInterface, Sequelize);
    await queryInterface.createTable(
      'message_templates',
      {
        id: c.id(),
        business_id: c.fk('businesses', 'CASCADE'),
        name: { type: Sequelize.STRING(120), allowNull: false },
        category: { type: Sequelize.ENUM('marketing', 'utility', 'authentication'), allowNull: false, defaultValue: 'marketing' },
        language: { type: Sequelize.STRING(10), allowNull: false, defaultValue: 'en' },
        body: { type: Sequelize.TEXT, allowNull: false },
        variables: { type: Sequelize.JSON, allowNull: true },
        status: { type: Sequelize.ENUM('approved', 'pending', 'rejected', 'draft'), allowNull: false, defaultValue: 'draft' },
        provider_template_id: { type: Sequelize.STRING(128), allowNull: true },
        is_demo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        ...c.timestamps(),
      },
      c.tableOptions
    );
    await queryInterface.addIndex('message_templates', ['business_id', 'name', 'language'], { unique: true, name: 'mt_business_name_lang_uq' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('message_templates');
  },
};
