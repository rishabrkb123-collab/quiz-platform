require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { addDebugLog } = require('./debugLogger');

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' }
  ]
});

prisma.$on('query', (event) => {
  addDebugLog('sql', `${event.query} | params=${event.params} | duration=${event.duration}ms`);
});

prisma.$on('error', (event) => {
  addDebugLog('error', event.message);
});

prisma.$on('warn', (event) => {
  addDebugLog('warn', event.message);
});

module.exports = prisma;
