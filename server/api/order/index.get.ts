import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { prisma } from '~/lib/prisma';
import { registry } from '../../utils/openapi';
import type { AuthContextPayload } from '~/types/auth';

extendZodWithOpenApi(z);

const OrderProductItemSchema = z
  .object({
    quantity: z.number().openapi({
      description: 'Quantity of the product in this order',
      example: 2,
    }),
    product: z
      .object({
        name: z.string().openapi({
          description: 'Product name',
          example: 'Mechanical Keyboard',
        }),
        coverId: z.string().nullable().optional().openapi({
          description: 'Cover image ID of the product',
          example: 'img_123456',
        }),
        vendor: z
          .object({
            name: z.string().openapi({
              description: 'Vendor name',
              example: 'NTUT Store',
            }),
          })
          .openapi('OrderHistoryVendor'),
      })
      .openapi('OrderHistoryProduct'),
  })
  .openapi('OrderHistoryProductItem');

const OrderHistoryItemSchema = z
  .object({
    id: z.string().openapi({
      description: 'Order ID',
      example: 'b77b32dd-d837-9cd66-93e4-45378916a3dc',
    }),
    price: z.number().openapi({
      description: 'Total price of the order',
      example: 1999,
    }),
    status: z.string().openapi({
      description: 'Current status of the order',
      example: 'RECEIVED',
    }),
    createdAt: z.string().datetime().openapi({
      description: 'Order creation datetime',
      example: '2025-11-29T08:30:00.000Z',
    }),
    products: z.array(OrderProductItemSchema).openapi({
      description: 'Products in this order',
    }),
  })
  .openapi('OrderHistoryItem');

const responseSchema = z
  .object({
    orders: z.array(OrderHistoryItemSchema).openapi({
      description: 'List of orders for the user',
    }),
  })
  .openapi('GetOrderHistoryResponse');

const errorSchema = z
  .object({
    statusCode: z.number().openapi({ example: 400 }),
    message: z.string().openapi({ example: 'Invalid userId' }),
  })
  .openapi('ErrorResponse');

registry.registerPath({
  method: 'get',
  path: '/api/order',
  tags: ['Order'],
  summary: 'Get order history 🔒',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Get order history successfully',
      content: {
        'application/json': {
          schema: responseSchema,
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
    401: {
      description: 'Unauthorized - Invalid or missing token',
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

  const userId = auth.userId;

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
