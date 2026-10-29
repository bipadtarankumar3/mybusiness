'use strict';

const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const dbConfig = require('../config/database');
const { getEnv } = require('../config/env');

const env = getEnv().NODE_ENV || 'development';
const config = dbConfig[env] || dbConfig.development;

const sequelize = new Sequelize(config.database || 'chatflow', config.username || 'chatflow', config.password || '', config);

const db = {};

fs.readdirSync(__dirname)
  .filter((file) => file.indexOf('.') !== 0 && file !== 'index.js' && !file.startsWith('_') && file.endsWith('.js'))
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (typeof db[modelName].associate === 'function') {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
