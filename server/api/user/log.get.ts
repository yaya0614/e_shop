import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  const userId = user.sub;

  try {
    const logs = await prisma.log.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return logs;
  } catch {
    throw createError({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }
});
