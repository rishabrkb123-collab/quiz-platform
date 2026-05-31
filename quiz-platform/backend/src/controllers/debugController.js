const { addDebugLog, getGlobalLogs } = require('../debugLogger');

function getLogs(_req, res) {
  addDebugLog('controller', 'debugController.getLogs()');
  res.json({ logs: getGlobalLogs() });
}

module.exports = {
  getLogs
};
