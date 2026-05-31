const express = require('express');
const questionsController = require('../controllers/questionsController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, questionsController.getQuestions);
router.post('/', authenticate, requireAdmin, questionsController.createQuestion);
router.delete('/:id', authenticate, requireAdmin, questionsController.deleteQuestion);

module.exports = router;
