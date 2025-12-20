import { defineEventHandler, readValidatedBody, createError } from 'h3';
import { prisma } from '~/lib/prisma';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from '~/server/utils/openapi';

extendZodWithOpenApi(z);

const updateProfileRequestSchema = z
  .object({
    name: z
      .string()
      .min(2, '名字至少需要2個字')
      .optional()
      .openapi({ description: '新名字', example: '欸嘿' }),
    address: z
      .string()
      .optional()
      .openapi({ description: '新地址', example: '驗證路1號' }),
  })
  .strict()
  .openapi('UpdateProfileRequest');

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
  method: 'patch',
  tags: ['User'],
  path: '/api/user/profile',
  summary: 'Update user profile',
  description: '更新個人資料',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': { schema: updateProfileRequestSchema },
      },
    },
  },
  responses: {
    200: {
      description: '更新成功',
      content: {
        'application/json': { schema: profileResponseSchema },
      },
    },
    400: { description: '參數錯誤' },
    401: { description: '未授權' },
    403: { description: '權限不足' },
    404: { description: '找不到使用者' },
    409: { description: '資料衝突' },
    413: { description: '請求內容過大' },
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

  if (auth.role === 'GUEST') {
    throw createError({
      statusCode: 403,
      message: '權限不足：訪客帳號無法修改資料',
    });
  }

  const body = await readValidatedBody(event, (data) =>
    updateProfileRequestSchema.parse(data),
  );

  if (Object.keys(body).length === 0) {
    throw createError({
      statusCode: 400,
      message: '未提供可更新的資料',
    });
  }

  if (JSON.stringify(body).length > 10000) {
    throw createError({
      statusCode: 413,
      message: '請求內容過大 (Payload Too Large)',
    });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: auth.userId },
      data: body,
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
      },
    });

    return { success: true, user: updatedUser };
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

    if (dbError.code === 'P2002') {
      throw createError({
        statusCode: 409,
        message: '資料衝突：該資料已被使用',
      });
    }

    if (dbError.code === 'P2003') {
      throw createError({
        statusCode: 409,
        message: '資料關聯錯誤：參照的對象不存在',
      });
    }

    if (dbError.code === 'P2000') {
      throw createError({
        statusCode: 400,
        message: '輸入資料超過欄位長度限制',
      });
    }

    if (dbError.code === 'P2005' || dbError.code === 'P2006') {
      throw createError({
        statusCode: 400,
        message: '資料庫欄位值無效',
      });
    }

    // eslint-disable-next-line no-console
    console.error('Unhandled Update Error:', e);
    throw e;
  }
});
