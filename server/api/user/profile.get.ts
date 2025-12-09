import { defineEventHandler, createError } from 'h3';
import { prisma } from '~/lib/prisma';
import { getUserFromEvent } from '~/server/utils/jwt';

export default defineEventHandler(async (event) => {
  const userPayload = getUserFromEvent(event);

  const user = await prisma.user.findUnique({
    where: { id: userPayload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      address: true,
      role: true,
    },
  });

  if (!user) {
    throw createError({ statusCode: 404, message: '找不到使用者' });
  }

  return { success: true, user };
});
