const express = require('express');
const answersController = require('../controllers/answersController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, answersController.submitAnswer);

module.exports = router;
