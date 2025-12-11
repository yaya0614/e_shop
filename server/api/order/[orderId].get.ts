import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { prisma } from '~/lib/prisma';
import { registry } from '../../utils/openapi';
import type { AuthContextPayload } from '~/types/auth';

extendZodWithOpenApi(z);

const schema = z.object({
  orderId: z.string().openapi({
    description: 'ID of order',
    example: 'b77b32dd-d837-9cd66-93e4-45378916a3dc',
  }),
});

const responseSchema = z
  .object({
    id: z.string().openapi({
      description: 'Order ID',
      example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
    }),

    products: z
      .array(
        z.object({
          quantity: z.int().openapi({
            description: 'Quantity of the product in the order',
            example: 2,
          }),

          product: z.object({
            id: z.string().openapi({
              description: 'Product ID',
              example: 'b332ab67-2b11-4a88-87ef-c53a88d9dd11',
            }),

            name: z.string().openapi({
              description: 'Product name',
              example: 'Premium Coffee Beans',
            }),

            description: z.string().openapi({
              description: 'Product description',
              example: 'Single-origin Arabica coffee beans with rich aroma',
            }),

            price: z.int().openapi({
              description: 'Unit price of the product',
              example: 500,
            }),

            coverId: z.string().openapi({
              description: 'Cover image ID of the product',
              example: 'coffee-cover-001',
            }),
          }),
        }),
      )
      .openapi({
        description: 'List of products included in the order',
      }),
  })
  .openapi('OrderDetailResponse');

registry.registerPath({
  method: 'get',
  tags: ['Order'],
  path: 'api/order/:orderId',
  summary: 'Get order detail 🔒',
  security: [{ bearerAuth: [] }],
  request: {
    params: schema,
  },
  responses: {
    200: {
      description: 'Get order detail successfully',
      content: {
        'application/json': {
          schema: responseSchema,
        },
      },
    },
    400: {
      description: 'Bad request',
    },
    401: {
      description: 'Unauthorized ',
    },
    404: {
      description: 'Not Found',
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

  const userId = auth.userId;

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
      userId,
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
