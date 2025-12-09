import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { prisma } from '~/lib/prisma';
import type { AuthContextPayload } from '~/types/auth';

extendZodWithOpenApi(z);

const Schema = z.object({
  originCategoryName: z.string().min(2).max(8).openapi({
    description: 'Origin Category Name',
    example: '心理學',
  }),
  categoryName: z.string().min(2).max(8).openapi({
    description: 'Category Name',
    example: '科幻',
  }),
});

const responsesSchema = z.object({
  statusMessge: z.literal('success').openapi({ example: 'success' }),
});

const errorSchema = z.object({
  statusCode: z.number().openapi({
    example: 400,
  }),
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
      content: {
        'application/json': {
          schema: errorSchema,
        },
      },
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
      message: 'Invalid request body',
    });
  }

  const { originCategoryName, categoryName } = payload.data;
  const targetName = await prisma.category.findFirst({
    where: {
      name: originCategoryName,
    },
    select: {
      id: true,
    },
  });
  if (!targetName) {
    throw createError({
      statusCode: 400,
      message: 'Origin Category Name Not Found',
    });
  }

  const exitsCtegoryName = await prisma.category.findFirst({
    where: {
      name: categoryName,
    },
  });
  if (exitsCtegoryName) {
    throw createError({
      statusCode: 400,
      message: 'Category Name Already Exists',
    });
  }

  await prisma.category.update({
    where: {
      id: targetName.id,
    },
    data: {
      name: categoryName,
    },
  });

  return {
    status: 'Update Success',
  };
});
