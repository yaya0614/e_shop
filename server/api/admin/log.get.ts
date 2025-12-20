import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const user = event.context.user

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized: 請先登入',
    })
  }

  if (user.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: 'Forbidden: 非管理員',
    })
  }

  try {
    const logs = await prisma.log.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return logs

  } catch {
    throw createError({
      statusCode: 500,
      message: 'Internal Server Error: 無法取得日誌',
    })
  }
})