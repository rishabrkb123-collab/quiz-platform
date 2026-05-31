const prisma = require('../prismaClient');
const { addDebugLog } = require('../debugLogger');
const httpError = require('../utils/httpError');

const ANSWERS = new Set(['A', 'B', 'C', 'D']);

function sanitizeQuestionForUser(question, role) {
  if (role === 'admin') {
    return question;
  }

  const { correctAnswer, ...safeQuestion } = question;
  return safeQuestion;
}

async function getQuestions(req, res, next) {
  try {
    addDebugLog('controller', 'questionsController.getQuestions()');
    addDebugLog('prisma', 'prisma.question.findMany({ orderBy: { id: "asc" } })');
    addDebugLog('sql', 'SELECT * FROM "Question" ORDER BY id ASC;');

    const questions = await prisma.question.findMany({ orderBy: { id: 'asc' } });
    const visibleQuestions = questions.map((question) => sanitizeQuestionForUser(question, req.user.role));

    res.json({ questions: visibleQuestions });
  } catch (error) {
    next(error);
  }
}

async function createQuestion(req, res, next) {
  try {
    addDebugLog('controller', 'questionsController.createQuestion()');

    const { questionText, optionA, optionB, optionC, optionD, correctAnswer, points } = req.body;
    const numericPoints = Number(points);

    if (!questionText || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
      throw httpError(400, 'questionText, optionA-D, and correctAnswer are required');
    }

    if (!ANSWERS.has(correctAnswer)) {
      throw httpError(400, 'correctAnswer must be A, B, C, or D');
    }

    if (!Number.isInteger(numericPoints) || numericPoints < 1) {
      throw httpError(400, 'points must be a positive integer');
    }

    addDebugLog('prisma', 'prisma.question.create({ data: { questionText, optionA-D, correctAnswer, points } })');
    addDebugLog('sql', 'INSERT INTO "Question" (questionText, optionA, optionB, optionC, optionD, correctAnswer, points) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;');
    const question = await prisma.question.create({
      data: {
        questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,
        points: numericPoints
      }
    });

    res.status(201).json({
      message: 'question added',
      question
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createQuestion,
  getQuestions
};
