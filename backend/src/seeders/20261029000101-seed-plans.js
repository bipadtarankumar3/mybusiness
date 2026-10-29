'use strict';

const models = require('../models');
const { seedPlans } = require('./runSeed');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up() {
    await seedPlans(models);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('plans', null, {});
  },
};
