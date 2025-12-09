import { defineEventHandler, createError } from 'h3';
import { prisma } from '~/lib/prisma';
import { getUserFromEvent } from '~/server/utils/jwt';

export default defineEventHandler(async (event) => {
  const userPayload = getUserFromEvent(event);

  if (!userPayload.vendor || !userPayload.vendor.id) {
    throw createError({
      statusCode: 403,
      message: '權限不足：您不是店家員工，無法查看操作紀錄',
    });
  }

  const currentVendorId = userPayload.vendor.id;

  try {
    const logs = await prisma.log.findMany({
      where: {
        vendorLogs: {
          some: {
            vendorId: currentVendorId,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        message: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return { success: true, data: logs };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get Vendor Log Error:', error);
    throw createError({ statusCode: 500, message: '讀取紀錄失敗' });
  }
});
