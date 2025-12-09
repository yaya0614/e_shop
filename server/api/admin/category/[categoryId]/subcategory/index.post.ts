import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { prisma } from '~/lib/prisma';
import type { AuthContextPayload } from '~/types/auth';

extendZodWithOpenApi(z);
const Schema = z.object({
  subCategoryName: z.string().min(2).max(8).openapi({
    description: 'subCategory Name',
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
  path: 'api/admin/category/{categoryId}/subcategory',
  tags: ['Admin'],
  summary: 'Create SubCategory',
  description: 'Create a new product subcategory name',
  request: {
    body: {
      content: {
        'application/json': {
          schema: Schema,
        },
      },
    },
    params: z.object({
      categoryId: z.string().openapi({
        description: 'Category Id',
        example: '98def785-f10f-4814-bb8e-15460e3bf951',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Create SubCategory Name Successfully',
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

  const categoryId = getRouterParam(event, 'categoryId');
  if (!categoryId) {
    throw createError({
      statusCode: 400,
      message: 'Category ID is required',
    });
  }

  const payload = await readValidatedBody(event, Schema.safeParse);
  if (!payload.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request body',
    });
  }

  const { subCategoryName } = payload.data;
  const exitsCtegoryName = await prisma.category.findFirst({
    where: { name: subCategoryName },
  });
  if (exitsCtegoryName) {
    throw createError({
      statusCode: 400,
      message: 'subCategory Name Already Exists',
    });
  }

  await prisma.subCategory.create({
    data: {
      categoryId: categoryId,
      name: subCategoryName,
    },
  });

  return {
    status: 'Create Success',
  };
});
