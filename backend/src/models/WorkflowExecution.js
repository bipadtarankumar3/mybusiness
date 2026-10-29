'use strict';
const { Model } = require('sequelize');
const cols = require('./_columns');

module.exports = (sequelize, DataTypes) => {
  const c = cols(DataTypes);
  class WorkflowExecution extends Model {
    static associate(m) {
      WorkflowExecution.belongsTo(m.Business, { foreignKey: 'businessId', as: 'business', onDelete: 'CASCADE' });
      WorkflowExecution.belongsTo(m.Workflow, { foreignKey: 'workflowId', as: 'workflow', onDelete: 'CASCADE' });
      WorkflowExecution.belongsTo(m.Conversation, { foreignKey: 'conversationId', as: 'conversation', onDelete: 'SET NULL' });
      WorkflowExecution.belongsTo(m.Customer, { foreignKey: 'customerId', as: 'customer', onDelete: 'SET NULL' });
    }
  }
  WorkflowExecution.init(
    {
      id: c.id(),
      businessId: c.fk(),
      workflowId: c.fk(),
      conversationId: c.fk(true),
      customerId: c.fk(true),
      triggerType: { type: DataTypes.STRING(40), allowNull: false },
      status: { type: DataTypes.ENUM('running', 'completed', 'failed', 'skipped'), allowNull: false, defaultValue: 'running' },
      log: { type: DataTypes.JSON, allowNull: true },
      startedAt: c.date(),
      finishedAt: c.date(),
      ...c.timestamps(),
    },
    {
      sequelize,
      modelName: 'WorkflowExecution',
      tableName: 'workflow_executions',
      underscored: true,
      indexes: [
        { fields: ['workflow_id', 'created_at'], name: 'wfe_workflow_created_idx' },
        { fields: ['business_id', 'created_at'], name: 'wfe_business_created_idx' },
      ],
    }
  );
  return WorkflowExecution;
};
