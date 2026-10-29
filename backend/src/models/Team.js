'use strict';
const { Model } = require('sequelize');
const cols = require('./_columns');

module.exports = (sequelize, DataTypes) => {
  const c = cols(DataTypes);
  class Team extends Model {
    static associate(m) {
      Team.belongsTo(m.Business, { foreignKey: 'businessId', as: 'business', onDelete: 'CASCADE' });
      Team.hasMany(m.BusinessMember, { foreignKey: 'teamId', as: 'members' });
    }
  }
  Team.init(
    {
      id: c.id(),
      businessId: c.fk(),
      name: { type: DataTypes.STRING(100), allowNull: false },
      description: { type: DataTypes.STRING(255), allowNull: true },
      ...c.timestamps(),
    },
    {
      sequelize,
      modelName: 'Team',
      tableName: 'teams',
      underscored: true,
      indexes: [{ unique: true, fields: ['business_id', 'name'], name: 'teams_business_name_uq' }],
    }
  );
  return Team;
};
