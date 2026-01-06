import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { prisma } from '~/lib/prisma';
import type { AuthContextPayload } from '~/types/auth';

extendZodWithOpenApi(z);

const responsesSchema = z.object({
  categories: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      subCategories: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
        }),
      ),
    }),
  ),
});

registry.registerPath({
  method: 'get',
  path: 'api/admin/category',
  tags: ['Admin'],
  summary: 'Get All Categories 🔒',
  description: 'Get all categories with their subcategories',
  responses: {
    200: {
      description: 'Get Categories Successfully',
      content: {
        'application/json': {
          schema: responsesSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    403: {
      description: 'Forbidden',
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

  const categories = await prisma.category.findMany({
    include: {
      subCategories: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return {
    categories,
  };
});
