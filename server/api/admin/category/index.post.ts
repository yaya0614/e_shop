import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { prisma } from '~/lib/prisma';
import type { AuthContextPayload } from '~/types/auth';

extendZodWithOpenApi(z);
const Schema = z.object({
  categoryName: z.string().min(2).max(8).openapi({
    description: 'Category Name',
    example: '心理學',
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
  method: 'post',
  path: 'api/admin/category',
  tags: ['Admin'],
  summary: 'Create Category',
  description: 'Create a new product category name',
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
      description: 'Create Category Name Successfully',
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

  const { categoryName } = payload.data;
  const exitsCtegoryName = await prisma.category.findFirst({
    where: { name: categoryName },
  });
  if (exitsCtegoryName) {
    throw createError({
      statusCode: 400,
      message: 'Category Name Already Exists',
    });
  }

  await prisma.category.create({
    data: {
      name: categoryName,
    },
  });

  return {
    status: 'Create Success',
  };
});
