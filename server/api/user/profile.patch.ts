import { defineEventHandler, readBody, createError } from 'h3';
import { prisma } from '~/lib/prisma';
import { getUserFromEvent } from '~/server/utils/jwt';

export default defineEventHandler(async (event) => {
  const userPayload = getUserFromEvent(event);

  const body = await readBody(event);

  const updateData: { name?: string; address?: string } = {};

  if (body.name) updateData.name = body.name;
  if (body.address !== undefined) updateData.address = body.address;

  if (Object.keys(updateData).length === 0) {
    return { success: false, message: '未提供可更新的資料' };
  }

  try {
    const updatedUser = await prisma.user.update({
      where: {
        id: userPayload.userId,
      },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
      },
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error('Update Error:', error);
    throw createError({ statusCode: 500, message: '更新失敗' });
  }
});
