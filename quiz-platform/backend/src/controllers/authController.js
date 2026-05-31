const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');
const { addDebugLog } = require('../debugLogger');
const httpError = require('../utils/httpError');

const ALLOWED_ROLES = new Set(['admin', 'normal_user']);

function signToken(user) {
  addDebugLog('terminal', 'jwt.sign({ userId, role }, JWT_SECRET)');
  return jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

async function register(req, res, next) {
  try {
    addDebugLog('controller', 'authController.register()');

    const { name, email, password, role = 'normal_user' } = req.body;

    if (!name || !email || !password) {
      throw httpError(400, 'name, email, and password are required');
    }

    if (!ALLOWED_ROLES.has(role)) {
      throw httpError(400, 'role must be admin or normal_user');
    }

    addDebugLog('prisma', 'prisma.user.findUnique({ where: { email } })');
    addDebugLog('sql', 'SELECT * FROM "User" WHERE email = $1 LIMIT 1;');
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      throw httpError(409, 'email already registered');
    }

    addDebugLog('terminal', 'bcrypt.hash(password, 10)');
    const hashedPassword = await bcrypt.hash(password, 10);

    addDebugLog('prisma', 'prisma.user.create({ data: { name, email, password: <bcrypt_hash>, role } })');
    addDebugLog('sql', 'INSERT INTO "User" (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role;');
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
      select: { id: true, name: true, email: true, role: true }
    });

    const token = signToken(user);

    res.status(201).json({
      message: 'registered',
      token,
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    addDebugLog('controller', 'authController.login()');

    const { email, password } = req.body;

    if (!email || !password) {
      throw httpError(400, 'email and password are required');
    }

    addDebugLog('prisma', 'prisma.user.findUnique({ where: { email } })');
    addDebugLog('sql', 'SELECT * FROM "User" WHERE email = $1 LIMIT 1;');
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw httpError(401, 'invalid email or password');
    }

    addDebugLog('terminal', 'bcrypt.compare(password, user.password)');
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw httpError(401, 'invalid password');
    }

    const token = signToken(user);

    res.json({
      message: 'login successful; token generated',
      token,
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  register
};
