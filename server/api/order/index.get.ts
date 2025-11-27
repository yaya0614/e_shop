import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { prisma } from '~/lib/prisma';

extendZodWithOpenApi(z);

const UserSchema = z.object({
  userId: z.string(),
});

registry.registerPath({
  method: 'get',
  path: '/api/order',
  tags: ['Order'],
  summary: 'get order history',
  request: {
    query: UserSchema,
  },
  responses: {
    200: {
      description: 'Get order history successfully',
    },
  },
});

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const userId = query.userId as string;

  if (!userId) {
    throw createError({
      statusCode: 400,
      message: 'Not found User id',
    });
  }

  const orderhistory = await prisma.user.findFirst({
    where: {
      id: userId,
    },
    select: {
      orders: {
        select: {
          id: true,
          price: true,
          status: true,
          createdAt: true,
          products: {
            select: {
              quantity: true,
              product: {
                select: {
                  name: true,
                  coverId: true,
                  vendor: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!orderhistory) {
    throw createError({
      statusCode: 404,
      message: 'Not Found OrderDetail',
    });
  }

  return orderhistory;
});
