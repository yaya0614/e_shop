import { prisma } from '~/lib/prisma';
import type { AuthContextPayload } from '~/types/auth';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { OrderStatus } from '~/prisma/generated/enums';
import type { Prisma } from '~/prisma/generated/client';

extendZodWithOpenApi(z);

const filterEnum = z.enum(Object.values(OrderStatus));
const querySchema = z.object({
  keyword: z.string().optional().openapi({
    description: 'Keyword to search order',
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
  filter: filterEnum.optional().openapi({
    description: 'Filter used to determine order sorting order',
    example: 'RECEIVED',
  }),
});

const OrderItemSchema = z.object({
  id: z.string().openapi({
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
  createdAt: z.string().datetime().openapi({
    description: 'Creation datetime of the order',
    example: '2025-11-29T08:30:00.000Z',
  }),
  updatedAt: z.string().datetime().openapi({
    description: 'Last update datetime of the order',
    example: '2025-11-30T10:15:00.000Z',
  }),
});

const responseSchema = z.object({
  orders: z.array(OrderItemSchema).openapi({
    description: 'List of orders',
  }),
  totalPages: z.number().openapi({
    description: 'Total number of pages',
    example: 10,
  }),
  page: z.number().openapi({
    description: 'Current page number',
    example: 1,
  }),
});

registry.registerPath({
  method: 'get',
  path: '/api/vendor/:vendorId/order',
  tags: ['Vendor'],
  summary: 'Get orders for a vendor 🔒',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      vendorId: z.string().openapi({
        description: 'Vendor ID',
        example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
      }),
    }),
    query: querySchema,
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

  const vendorId = getRouterParam(event, 'vendorId');
  if (!vendorId) {
    throw createError({
      statusCode: 400,
      message: 'Vendor ID is required',
    });
  }

  if (auth.vendor?.id !== vendorId) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden',
    });
  }

  const query = getQuery(event);
  const queryResult = querySchema.safeParse(query);

  if (!queryResult.success) {
    throw createError({
      statusCode: 400,
      message: 'Bad Request',
    });
  }

  const { keyword, page, limit, filter } = queryResult.data;
  const findCondition: Prisma.OrderWhereInput = {
    vendorId: vendorId,
    OR: keyword
      ? [
          {
            user: {
              name: {
                contains: keyword,
              },
            },
          },
          {
            user: {
              email: {
                contains: keyword,
              },
            },
          },
          {
            user: {
              address: {
                contains: keyword,
              },
            },
          },
          {
            products: {
              some: {
                product: {
                  name: { contains: keyword },
                },
              },
            },
          },
          {
            coupon: {
              code: {
                contains: keyword,
              },
            },
          },
        ]
      : undefined,
    status: filter ? filter : undefined,
  };

  const orders = await prisma.order.findMany({
    where: findCondition,
    include: {
      products: {
        include: {
          product: true,
        },
      },
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return {
    orders: orders.map((order) => ({
      id: order.id,
      price: order.price,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    })),
  };
});
