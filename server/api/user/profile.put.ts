// server/api/user/profile.put.ts
// import { PrismaClient } from '@prisma/client'

// const prisma = new PrismaClient()
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { prisma } from '~/lib/prisma';

extendZodWithOpenApi(z);

const updateProfileSchema = z.object({
  name: z.string().min(1).optional().openapi({ description: '新姓名' }),
  address: z.string().optional().openapi({ description: '新地址' }),
});

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: '未登入' });
  }

  // 驗證請求資料
  const result = await readValidatedBody(event, updateProfileSchema.safeParse);

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.message,
    });
  }

  // 更新使用者資料
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: result.data.name,
      address: result.data.address,
    },
    select: { id: true, name: true, email: true, address: true },
  });

  return updatedUser;
});
