import { prisma } from '~/lib/prisma';
import type { AuthContextPayload } from '~/types/auth';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

const OrderItemSchema = z.object({
  orderId: z.string().openapi({
    description: 'Order ID',
    example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
  }),
  price: z.number().openapi({
    description: 'Price of the order',
    example: 1999,
  }),
  status: z.string().openapi({
    description: 'Status of the order',
    example: 'RECEIVED',
  }),
  userName: z.string().openapi({
    description: 'Name of the user who placed the order',
    example: 'John Doe',
  }),
  createdAt: z.string().datetime().openapi({
    description: 'Creation datetime of the order',
    example: '2025-11-29T08:30:00.000Z',
  }),
  updatedAt: z.string().datetime().openapi({
    description: 'Last update datetime of the order',
    example: '2025-11-30T10:15:00.000Z',
  }),
  products: z
    .array(
      z.object({
        productId: z.string().openapi({
          description: 'Product ID',
          example: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
        }),
        quantity: z.number().openapi({
          description: 'Quantity of the product in the order',
          example: 2,
        }),
      }),
    )
    .openapi({
      description: 'List of products in the order',
    }),
});

const responseSchema = z.object({
  orders: z.array(OrderItemSchema).openapi({
    description: 'List of orders',
  }),
});

const paramsSchema = z.object({
  vendorId: z.string().openapi({
    description: 'Vendor ID',
    example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
  }),
});

registry.registerPath({
  method: 'get',
  path: '/api/vendor/:vendorId/order',
  tags: ['Vendor'],
  summary: 'Get orders for a vendor 🔒',
  security: [{ bearerAuth: [] }],
  request: {
    params: paramsSchema,
  },
  responses: {
    200: {
      description: 'Get orders for a vendor successfully',
      content: {
        'application/json': {
          schema: responseSchema,
        },
      },
    },
    400: {
      description: 'Bad Request',
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

  const { data: params, success } = await getValidatedRouterParams(
    event,
    paramsSchema.safeParse,
  );

  if (!success) {
    throw createError({
      statusCode: 400,
      message: 'Bad Request',
    });
  }

  if (auth.vendor?.id !== params.vendorId) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden',
    });
  }

  const orders = await prisma.order.findMany({
    where: {
      vendorId: params.vendorId,
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
      products: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return {
    orders: orders.map((order) => ({
      orderId: order.id,
      price: order.price,
      status: order.status,
      userName: order.user.name,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      products: order.products.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    })),
  };
});
