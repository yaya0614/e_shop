import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { prisma } from '~/lib/prisma';

extendZodWithOpenApi(z);

const schema = z.object({
  orderId: z.string().openapi({
    description: 'ID of order',
    example: 'b77b32dd-d837-9cd66-93e4-45378916a3dc',
  }),
});

registry.registerPath({
  method: 'get',
  tags: ['Order'],
  path: 'api/order/:orderId',
  summary: 'get order detail',
  request: {
    params: schema,
  },
  responses: {
    200: {
      description: 'Get order detail successfully',
    },
  },
});

export default defineEventHandler(async (event) => {
  const orderId = getRouterParam(event, 'orderId');

  if (!orderId) {
    throw createError({
      statusCode: 400,
      message: 'Not found Order id',
    });
  }

  const orderdetail = await prisma.order.findFirst({
    where: {
      id: orderId,
    },
    include: {
      products: {
        select: {
          quantity: true,
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              coverId: true,
            },
          },
        },
      },
    },
  });
  if (!orderdetail) {
    throw createError({
      statusCode: 404,
      message: 'Not found Order',
    });
  }
  return orderdetail;
});
