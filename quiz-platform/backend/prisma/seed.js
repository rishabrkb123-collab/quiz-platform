const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Submission", "Question", "User" RESTART IDENTITY CASCADE;');

  const password = await bcrypt.hash('password123', 10);

  await prisma.user.createMany({
    data: [
      { name: 'Admin User', email: 'admin@quiz.com', password, role: 'admin' },
      { name: 'Normal User One', email: 'user1@quiz.com', password, role: 'normal_user' },
      { name: 'Normal User Two', email: 'user2@quiz.com', password, role: 'normal_user' }
    ]
  });

  await prisma.question.createMany({
    data: [
      {
        questionText: 'Which runtime is commonly used to run Express applications?',
        optionA: 'Node.js',
        optionB: 'Django',
        optionC: 'Laravel',
        optionD: 'Rails',
        correctAnswer: 'A',
        points: 10
      },
      {
        questionText: 'Which SQL keyword retrieves rows from a table?',
        optionA: 'PUSH',
        optionB: 'SELECT',
        optionC: 'PULL',
        optionD: 'EMIT',
        correctAnswer: 'B',
        points: 10
      },
      {
        questionText: 'What does JWT commonly stand for?',
        optionA: 'Java Web Token',
        optionB: 'Joined Wire Transfer',
        optionC: 'JSON Web Token',
        optionD: 'JavaScript Web Task',
        correctAnswer: 'C',
        points: 15
      },
      {
        questionText: 'Which Prisma command creates and applies a development migration?',
        optionA: 'npx prisma studio',
        optionB: 'npx prisma generate',
        optionC: 'npx prisma seed',
        optionD: 'npx prisma migrate dev',
        correctAnswer: 'D',
        points: 15
      },
      {
        questionText: 'Which HTTP status code usually means unauthorized?',
        optionA: '200',
        optionB: '201',
        optionC: '401',
        optionD: '500',
        correctAnswer: 'C',
        points: 10
      }
    ]
  });

  console.log('Seed complete: admin@quiz.com / password123, user1@quiz.com / password123, user2@quiz.com / password123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
