import { defineEventHandler, createError } from 'h3';
import { prisma } from '~/lib/prisma';

export default defineEventHandler(async (event) => {
  const auth = event.context.auth;

  if (!auth || !auth.authenticated) {
    throw createError({
      statusCode: 401,
      message: '未授權 (Unauthorized)',
    });
  }

  if (!auth.vendor || !auth.vendor.id) {
    throw createError({
      statusCode: 403,
      message: '權限不足：您不是店家員工，無法查看操作紀錄',
    });
  }

  const currentVendorId = auth.vendor.id;

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
