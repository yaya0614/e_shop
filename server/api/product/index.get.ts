import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { prisma } from '~/lib/prisma';
import type { Prisma } from '~/prisma/generated/client';
import type { AuthContextPayload } from '~/types/auth';

extendZodWithOpenApi(z);

const FilterEnum = z.enum(['NEWEST', 'OLDEST', 'PRICE_LOW', 'PRICE_HIGH']);
const schema = z.object({
  keyword: z.string().optional().openapi({
    description: 'Keyword to search products',
    example: '心裡',
  }),
  page: z
    .string()
    .default('1')
    .transform((val) => (isNaN(parseInt(val)) ? 1 : parseInt(val))),
  limit: z
    .string()
    .default('30')
    .transform((val) => (isNaN(parseInt(val)) ? 30 : parseInt(val))),
  Filter: FilterEnum.optional().openapi({
    description: 'Filter used to determine product sorting order',
    example: 'NEWEST',
  }),
});

const responsesSchema = z.array(
  z.object({
    id: z.string().openapi({
      description: 'Product Id',
      example: 'c72d13fa-1d2a-44c4-a4d3-3b19adf17da5',
    }),
    name: z.string().openapi({
      description: 'Product Name',
      example: '把心安放在喜歡的位置',
    }),
    description: z.string().openapi({
      description: 'Product Description',
      example: '一本陪伴焦慮世代的生活指南，幫助你重拾秩序與平靜。',
    }),
    price: z.number().openapi({
      description: 'Product Price',
      example: 340,
    }),
    coverId: z.string().openapi({
      description: 'Product Image Id',
      example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567007',
    }),
  }),
);

const errorSchema = z.object({
  statusCode: z.number().openapi({
    example: 400,
  }),
});

registry.registerPath({
  method: 'get',
  path: 'api/product',
  tags: ['Product'],
  summary: 'Product List',
  description: 'Show Product List',
  request: {
    query: schema,
  },
  responses: {
    200: {
      description: 'Successful Response',
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
  if (!auth.authenticated) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }
  if (!auth.userId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  const query = getQuery(event);
  const queryResult = schema.safeParse(query);

  if (!queryResult.success) {
    throw createError({
      statusCode: 400,
      message: 'Bad Request',
    });
  }

  const { keyword, page, limit, Filter } = queryResult.data;
  const findCondition: Prisma.ProductWhereInput = {
    status: 'ACTIVE',
    OR: keyword
      ? [
          { name: { contains: keyword } },
          { description: { contains: keyword } },
          {
            subCategory: {
              is: {
                name: { contains: keyword },
              },
            },
          },
          {
            subCategory: {
              is: {
                category: {
                  is: {
                    name: { contains: keyword },
                  },
                },
              },
            },
          },
        ]
      : undefined,
  };

  const getOrderBy = (
    Filter: string,
  ): Prisma.ProductOrderByWithRelationInput => {
    switch (Filter) {
      case 'NEWEST':
        return { updatedAt: 'desc' };
      case 'OLDEST':
        return { updatedAt: 'asc' };
      case 'PRICE_LOW':
        return { price: 'asc' };
      case 'PRICE_HIGH':
        return { price: 'desc' };
      default:
        return { updatedAt: 'desc' };
    }
  };

  const products = await prisma.product.findMany({
    where: findCondition,
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      coverId: true,
      updatedAt: true,
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: getOrderBy(Filter ?? 'NEWEST'),
  });

  return products;
});
