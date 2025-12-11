import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { prisma } from '~/lib/prisma';
import type { AuthContextPayload } from '~/types/auth';

extendZodWithOpenApi(z);
const Schema = z.object({
  originsubCategoryId: z.uuid().openapi({
    description: 'Origin SubCategory Id',
    example: '98def785-f10f-4814-bb8e-15460e3bf951',
  }),
  subCategoryName: z.string().min(2).max(8).openapi({
    description: 'Replace SubCategory Name',
    example: '科幻',
  }),
});

const responsesSchema = z.object({
  statusMessge: z.literal('success').openapi({ example: 'success' }),
});

registry.registerPath({
  method: 'put',
  path: 'api/admin/category/{categoryId}/subcategory',
  tags: ['Admin'],
  summary: 'Update SubCategory Name 🔒',
  description: 'Update subcategory name by admin',
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
      description: 'Update SubCategory Name Successfully',
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
      description: 'Conflict - SubCategory Name Already Exists',
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

  const { originsubCategoryId, subCategoryName } = payload.data;
  const targetReplaceId = await prisma.subCategory.findUnique({
    where: {
      id: originsubCategoryId,
    },
  });

  if (!targetReplaceId) {
    throw createError({
      statusCode: 404,
      message: 'Origin SubCategory Id Not Found',
    });
  }

  const exitsSubCtegoryName = await prisma.subCategory.findFirst({
    where: {
      name: subCategoryName,
    },
  });
  if (exitsSubCtegoryName) {
    throw createError({
      statusCode: 409,
      message: 'SubCategory Name Already Exists',
    });
  }

  await prisma.subCategory.update({
    where: {
      id: originsubCategoryId,
    },
    data: {
      name: subCategoryName,
    },
  });

  return {
    status: 'Update Success',
  };
});
