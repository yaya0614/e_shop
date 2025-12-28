import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { prisma } from '~/lib/prisma';
import type { AuthContextPayload } from '~/types/auth';

extendZodWithOpenApi(z);
const Schema = z.object({
  categoryId: z.string().uuid().openapi({
    description: 'Category Id',
    example: '103ece51-6a66-4622-9c82-1bcba0ae28ad',
  }),
});

const responsesSchema = z.object({
  statusMessge: z.literal('success').openapi({ example: 'success' }),
});

registry.registerPath({
  method: 'delete',
  path: 'api/admin/category',
  tags: ['Admin'],
  summary: 'Delete Category 🔒',
  description: 'Delete category by admin',
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
      description: 'Delete Category Successfully',
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

  const { categoryId } = payload.data;
  const category = await prisma.category.findUnique({
    where: {
      id: categoryId,
    },
    include: {
      subCategories: true,
    },
  });

  if (!category) {
    throw createError({
      statusCode: 404,
      message: 'Category Not Found',
    });
  }

  const userId = auth.userId;

  await prisma.$transaction(async (tx) => {
    await tx.subCategory.deleteMany({
      where: {
        categoryId: categoryId,
      },
    });

    await tx.category.delete({
      where: {
        id: categoryId,
      },
    });

    await tx.adminLog.create({
      data: {
        log: {
          create: {
            userId: userId,
            message: `Delete Category ${category.name}`,
          },
        },
      },
    });
  });

  return {
    status: 'Delete Success',
  };
});
