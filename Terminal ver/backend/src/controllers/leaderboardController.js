const prisma = require('../prismaClient');
const { addDebugLog } = require('../debugLogger');

async function getLeaderboard(_req, res, next) {
  try {
    addDebugLog('controller', 'leaderboardController.getLeaderboard()');
    addDebugLog('prisma', 'prisma.$queryRaw`SELECT rank, user name, SUM(points) FROM submissions`');
    addDebugLog('sql', 'SELECT ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(CASE WHEN s."isCorrect" THEN q.points ELSE 0 END), 0) DESC, u.name ASC) AS rank, u.id, u.name, COALESCE(SUM(CASE WHEN s."isCorrect" THEN q.points ELSE 0 END), 0)::int AS score FROM "User" u LEFT JOIN "Submission" s ON s."userId" = u.id LEFT JOIN "Question" q ON q.id = s."questionId" GROUP BY u.id ORDER BY score DESC, u.name ASC;');

    const rows = await prisma.$queryRaw`
      SELECT
        ROW_NUMBER() OVER (
          ORDER BY COALESCE(SUM(CASE WHEN s."isCorrect" THEN q.points ELSE 0 END), 0) DESC, u.name ASC
        ) AS rank,
        u.id,
        u.name,
        COALESCE(SUM(CASE WHEN s."isCorrect" THEN q.points ELSE 0 END), 0)::int AS score
      FROM "User" u
      LEFT JOIN "Submission" s ON s."userId" = u.id
      LEFT JOIN "Question" q ON q.id = s."questionId"
      GROUP BY u.id
      ORDER BY score DESC, u.name ASC;
    `;

    const leaderboard = rows.map((row) => ({
      rank: Number(row.rank),
      userId: row.id,
      name: row.name,
      score: Number(row.score)
    }));

    res.json({ leaderboard });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getLeaderboard
};
