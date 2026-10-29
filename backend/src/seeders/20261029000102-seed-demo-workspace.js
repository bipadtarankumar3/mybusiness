'use strict';

const models = require('../models');
const { seedDemoWorkspace } = require('./runSeed');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up() {
    await seedDemoWorkspace(models);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('businesses', { slug: ['sharma-fashion-house-demo', 'verma-electronics'] }, {});
    await queryInterface.bulkDelete('users', { email: ['demo@chatflow.local', 'neha@chatflow.local', 'amit@chatflow.local', 'other@chatflow.local'] }, {});
  },
};
