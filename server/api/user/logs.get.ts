import { prisma } from '~/lib/prisma'; 

export default defineEventHandler(async (event) => {
  const user = event.context.user;

  if (!user) {
    throw createError({ statusCode: 401, message: '請先登入' });
  }

  try {
    const logs = await prisma.log.findMany({
      where: {
        userId: user.id, 
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
      select: {
        id: true,
        message: true, // ✅ 修正：你的資料庫用的是 message 欄位
        createdAt: true,
      }
    });

    return {
      success: true,
      data: logs,
    };

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get Logs Error:', error);
    throw createError({ statusCode: 500, message: '無法取得日誌紀錄' });
  }
});