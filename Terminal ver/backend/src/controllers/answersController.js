const prisma = require('../prismaClient');
const { addDebugLog } = require('../debugLogger');
const httpError = require('../utils/httpError');

const ANSWERS = new Set(['A', 'B', 'C', 'D']);

async function submitAnswer(req, res, next) {
  try {
    addDebugLog('controller', 'answersController.submitAnswer()');

    const { questionId, selectedAnswer } = req.body;
    const numericQuestionId = Number(questionId);

    if (!Number.isInteger(numericQuestionId)) {
      throw httpError(400, 'questionId must be an integer');
    }

    if (!ANSWERS.has(selectedAnswer)) {
      throw httpError(400, 'selectedAnswer must be A, B, C, or D');
    }

    addDebugLog('prisma', 'prisma.question.findUnique({ where: { id: questionId } })');
    addDebugLog('sql', 'SELECT * FROM "Question" WHERE id = $1 LIMIT 1;');
    const question = await prisma.question.findUnique({ where: { id: numericQuestionId } });

    if (!question) {
      throw httpError(404, 'question not found');
    }

    const isCorrect = question.correctAnswer === selectedAnswer;

    addDebugLog('prisma', 'prisma.submission.upsert({ where: { userId_questionId }, create, update })');
    addDebugLog('sql', 'INSERT INTO "Submission" (userId, questionId, selectedAnswer, isCorrect) VALUES ($1, $2, $3, $4) ON CONFLICT (userId, questionId) DO UPDATE SET selectedAnswer = $3, isCorrect = $4 RETURNING *;');
    const submission = await prisma.submission.upsert({
      where: {
        userId_questionId: {
          userId: req.user.id,
          questionId: question.id
        }
      },
      update: {
        selectedAnswer,
        isCorrect
      },
      create: {
        userId: req.user.id,
        questionId: question.id,
        selectedAnswer,
        isCorrect
      }
    });

    res.json({
      message: 'answer saved',
      isCorrect,
      awardedPoints: isCorrect ? question.points : 0,
      submission
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  submitAnswer
};
