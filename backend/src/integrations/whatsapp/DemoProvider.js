'use strict';

class DemoProvider {
  constructor() {
    this.mode = 'demo';
  }

  async sendText() {
    return {
      accepted: false,
      simulated: true,
      status: 'simulated',
      providerMessageId: null,
    };
  }

  async sendTemplate() {
    return {
      accepted: false,
      simulated: true,
      status: 'simulated',
      providerMessageId: null,
    };
  }
}

module.exports = DemoProvider;
