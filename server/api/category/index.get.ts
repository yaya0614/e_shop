import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { prisma } from '~/lib/prisma';

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
  path: 'api/category',
  tags: ['Category'],
  summary: 'Get All Categories',
  description: 'Get all categories with their subcategories (public endpoint)',
  responses: {
    200: {
      description: 'Get Categories Successfully',
      content: {
        'application/json': {
          schema: responsesSchema,
        },
      },
    },
  },
});

export default defineEventHandler(async () => {
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
