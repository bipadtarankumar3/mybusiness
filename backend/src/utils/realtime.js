'use strict';

let ioInstance = null;

function setSocketServer(io) {
  ioInstance = io;
}

function emitToBusiness(businessId, event, payload) {
  if (!ioInstance || !businessId) return;
  ioInstance.to(`business:${businessId}`).emit(event, payload);
}

module.exports = { setSocketServer, emitToBusiness };
