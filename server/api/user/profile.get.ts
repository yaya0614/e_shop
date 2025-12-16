import { defineEventHandler, createError } from 'h3';
import { prisma } from '~/lib/prisma';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from '~/server/utils/openapi';

extendZodWithOpenApi(z);

const profileResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
    user: z.object({
      id: z.string(),
      name: z.string().nullable(),
      email: z.string(),
      address: z.string().nullable(),
      role: z.enum(['USER', 'ADMIN', 'GUEST']),
    }),
  })
  .openapi('UserProfileResponse');

registry.registerPath({
  method: 'get',
  tags: ['User'],
  path: '/api/user/profile',
  summary: 'Get user profile',
  description: '取得目前登入使用者的個人資料',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: '成功取得資料',
      content: { 'application/json': { schema: profileResponseSchema } },
    },
    401: { description: '未授權 (Token 無效)' },
    404: { description: '找不到使用者' },
    500: { description: '伺服器內部錯誤' },
  },
});

export default defineEventHandler(async (event) => {
  const auth = event.context.auth;

  if (!auth || !auth.authenticated || !auth.userId) {
    throw createError({
      statusCode: 401,
      message: '未授權 (Unauthorized)',
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
      },
    });

    if (!user) {
      throw createError({
        statusCode: 404,
        message: '找不到使用者',
      });
    }

    return { success: true, user };
  } catch (e: unknown) {
    const dbError = e as {
      code?: string;
      meta?: Record<string, unknown>;
      message?: string;
    };

    if (dbError.code === 'P2025') {
      throw createError({
        statusCode: 404,
        message: '找不到使用者',
      });
    }
    // eslint-disable-next-line no-console
    console.error('Get Profile Error:', e);

    throw e;
  }
});
