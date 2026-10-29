'use strict';
const { Model } = require('sequelize');
const cols = require('./_columns');

module.exports = (sequelize, DataTypes) => {
  const c = cols(DataTypes);
  class BusinessMember extends Model {
    static associate(m) {
      BusinessMember.belongsTo(m.Business, { foreignKey: 'businessId', as: 'business', onDelete: 'CASCADE' });
      BusinessMember.belongsTo(m.User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
      BusinessMember.belongsTo(m.Team, { foreignKey: 'teamId', as: 'team', onDelete: 'SET NULL' });
    }
  }
  BusinessMember.init(
    {
      id: c.id(),
      businessId: c.fk(),
      userId: c.fk(),
      teamId: c.fk(true),
      role: { type: DataTypes.ENUM('owner', 'admin', 'agent'), allowNull: false, defaultValue: 'agent' },
      status: { type: DataTypes.ENUM('active', 'invited', 'disabled'), allowNull: false, defaultValue: 'active' },
      ...c.timestamps(),
    },
    {
      sequelize,
      modelName: 'BusinessMember',
      tableName: 'business_members',
      underscored: true,
      indexes: [
        { unique: true, fields: ['business_id', 'user_id'], name: 'bm_business_user_uq' },
        { fields: ['user_id'], name: 'bm_user_idx' },
        { fields: ['team_id'], name: 'bm_team_idx' },
      ],
    }
  );
  return BusinessMember;
};
