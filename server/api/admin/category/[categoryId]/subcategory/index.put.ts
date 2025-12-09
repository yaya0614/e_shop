import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { prisma } from '~/lib/prisma';
import type { AuthContextPayload } from '~/types/auth';

extendZodWithOpenApi(z);
const Schema = z.object({
  originsubCategoryName: z.string().min(2).max(8).openapi({
    description: 'Origin Category Name',
    example: '心理學',
  }),
  subCategoryName: z.string().min(2).max(8).openapi({
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
  path: 'api/admin/category/{categoryId}/subcategory',
  tags: ['Admin'],
  summary: 'Update SubCategory Name',
  description: 'Update subcategory name by admin',
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
      description: 'Update SubCategory Name Successfully',
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

  const { originsubCategoryName, subCategoryName } = payload.data;
  const targetName = await prisma.subCategory.findFirst({
    where: {
      name: originsubCategoryName,
    },
    select: {
      id: true,
    },
  });

  if (!targetName) {
    throw createError({
      statusCode: 400,
      message: 'Origin SubCategory Name Not Found',
    });
  }

  const exitsCtegoryName = await prisma.subCategory.findFirst({
    where: {
      name: subCategoryName,
    },
  });
  if (exitsCtegoryName) {
    throw createError({
      statusCode: 400,
      message: 'SubCategory Name Already Exists',
    });
  }

  await prisma.subCategory.update({
    where: {
      id: targetName.id,
    },
    data: {
      name: subCategoryName,
    },
  });

  return {
    status: 'Update Success',
  };
});
