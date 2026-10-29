'use strict';
const { Model } = require('sequelize');
const cols = require('./_columns');

module.exports = (sequelize, DataTypes) => {
  const c = cols(DataTypes);
  class Workflow extends Model {
    static associate(m) {
      Workflow.belongsTo(m.Business, { foreignKey: 'businessId', as: 'business', onDelete: 'CASCADE' });
      Workflow.belongsTo(m.User, { foreignKey: 'createdByUserId', as: 'createdBy', onDelete: 'SET NULL' });
      Workflow.hasMany(m.WorkflowExecution, { foreignKey: 'workflowId', as: 'executions' });
    }
  }
  Workflow.init(
    {
      id: c.id(),
      businessId: c.fk(),
      createdByUserId: c.fk(true),
      name: { type: DataTypes.STRING(150), allowNull: false },
      description: { type: DataTypes.STRING(500), allowNull: true },
      status: { type: DataTypes.ENUM('draft', 'published', 'paused'), allowNull: false, defaultValue: 'draft' },
      triggerType: { type: DataTypes.STRING(40), allowNull: true },
      triggerConfig: { type: DataTypes.JSON, allowNull: true },
      definition: { type: DataTypes.JSON, allowNull: false },
      publishedAt: c.date(),
      executionCount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      isDemo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      ...c.timestamps(),
    },
    {
      sequelize,
      modelName: 'Workflow',
      tableName: 'workflows',
      underscored: true,
      indexes: [{ fields: ['business_id', 'status', 'trigger_type'], name: 'workflows_business_status_trigger_idx' }],
    }
  );
  return Workflow;
};
