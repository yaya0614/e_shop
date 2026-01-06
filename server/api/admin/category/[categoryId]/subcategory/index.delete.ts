import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { prisma } from '~/lib/prisma';
import type { AuthContextPayload } from '~/types/auth';

extendZodWithOpenApi(z);
const Schema = z.object({
  subCategoryId: z.string().uuid().openapi({
    description: 'SubCategory Id',
    example: '103ece51-6a66-4622-9c82-1bcba0ae28ad',
  }),
});

const responsesSchema = z.object({
  statusMessge: z.literal('success').openapi({ example: 'success' }),
});

registry.registerPath({
  method: 'delete',
  path: 'api/admin/category/{categoryId}/subcategory',
  tags: ['Admin'],
  summary: 'Delete SubCategory 🔒',
  description: 'Delete subcategory by admin',
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
      description: 'Delete SubCategory Successfully',
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

  const { subCategoryId } = payload.data;
  const subCategory = await prisma.subCategory.findUnique({
    where: {
      id: subCategoryId,
    },
  });

  if (!subCategory) {
    throw createError({
      statusCode: 404,
      message: 'SubCategory Not Found',
    });
  }

  const userId = auth.userId;

  await prisma.$transaction(async (tx) => {
    await tx.subCategory.delete({
      where: {
        id: subCategoryId,
      },
    });

    await tx.adminLog.create({
      data: {
        log: {
          create: {
            userId: userId,
            message: `Delete SubCategory ${subCategory.name}`,
          },
        },
      },
    });
  });

  return {
    status: 'Delete Success',
  };
});
