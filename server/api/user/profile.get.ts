import { defineEventHandler, createError } from 'h3';
import { prisma } from '~/lib/prisma';

export default defineEventHandler(async (event) => {
  const auth = event.context.auth;

  if (!auth || !auth.authenticated || !auth.userId) {
    throw createError({
      statusCode: auth?.error?.code || 401,
      message: auth?.error?.message || '未授權 (Unauthorized)',
    });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: auth.userId,
    },
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
