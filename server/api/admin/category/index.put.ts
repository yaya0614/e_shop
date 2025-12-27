import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { prisma } from '~/lib/prisma';
import type { AuthContextPayload } from '~/types/auth';

extendZodWithOpenApi(z);
const Schema = z.object({
  originCategoryId: z.uuid().openapi({
    description: 'Origin Category Id',
    example: '103ece51-6a66-4622-9c82-1bcba0ae28ad',
  }),
  categoryName: z.string().min(2).max(8).openapi({
    description: 'Category Name',
    example: '科幻',
  }),
});

const responsesSchema = z.object({
  statusMessge: z.literal('success').openapi({ example: 'success' }),
});

registry.registerPath({
  method: 'put',
  path: 'api/admin/category',
  tags: ['Admin'],
  summary: 'Update Category Name 🔒',
  description: 'Update category name by admin',
  request: {
    body: {
      content: {
        'application/json': {
          schema: Schema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Update Category Name Successfully',
      content: {
        'application/json': {
          schema: responsesSchema,
        },
      },
    },
    400: {
      description: 'Bad request',
    },
    401: {
      description: 'Unauthorized',
    },
    403: {
      description: 'Forbidden',
    },
    404: {
      description: 'Not Found',
    },
    409: {
      description: 'Conflict - Category Name Already Exists',
    },
  },
});

export default defineEventHandler(async (event) => {
  const auth: AuthContextPayload = event.context.auth;
  if (!auth.authenticated || !auth.userId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  if (auth.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: 'forbidden',
    });
  }

  const payload = await readValidatedBody(event, Schema.safeParse);
  if (!payload.success) {
    throw createError({
      statusCode: 400,
      message: 'Bad Request',
    });
  }

  const { originCategoryId, categoryName } = payload.data;
  const targetReplaceId = await prisma.category.findUnique({
    where: {
      id: originCategoryId,
    },
  });
  if (!targetReplaceId) {
    throw createError({
      statusCode: 404,
      message: 'Origin Category Id Not Found',
    });
  }

  const exitsCtegoryName = await prisma.category.findFirst({
    where: {
      name: categoryName,
    },
  });
  if (exitsCtegoryName) {
    throw createError({
      statusCode: 409,
      message: 'Category Name Already Exists',
    });
  }

  const userId = auth.userId;

  await prisma.$transaction(async (tx) => {
    await tx.category.update({
      where: {
        id: originCategoryId,
      },
      data: {
        name: categoryName,
      },
    });

    await tx.adminLog.create({
      data: {
        log: {
          create: {
            userId: userId,
            message: `Update Category ${categoryName}`,
          },
        },
      },
    });
  });

  return {
    status: 'Update Success',
  };
});
