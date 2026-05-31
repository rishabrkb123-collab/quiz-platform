const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');
const { addDebugLog } = require('../debugLogger');
const httpError = require('../utils/httpError');

async function authenticate(req, _res, next) {
  try {
    addDebugLog('middleware', 'authMiddleware.authenticate()');

    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      throw httpError(401, 'missing bearer token');
    }

    addDebugLog('terminal', 'jwt.verify(token, JWT_SECRET)');
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    addDebugLog('prisma', 'prisma.user.findUnique({ where: { id: token.userId } })');
    addDebugLog('sql', 'SELECT id, name, email, role FROM "User" WHERE id = $1 LIMIT 1;');
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!user) {
      throw httpError(401, 'user not found for token');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error.status ? error : httpError(401, 'invalid token'));
  }
}

function requireAdmin(req, _res, next) {
  addDebugLog('middleware', 'authMiddleware.requireAdmin()');

  if (!req.user || req.user.role !== 'admin') {
    next(httpError(403, 'admin role required'));
    return;
  }

  next();
}

module.exports = {
  authenticate,
  requireAdmin
};
