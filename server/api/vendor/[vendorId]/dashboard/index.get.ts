import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { prisma } from '~/lib/prisma';
import type { AuthContextPayload } from '~/types/auth';
import { OrderStatus } from '~/prisma/generated/enums';

extendZodWithOpenApi(z);

const schema = z.object({
  yearFilter: z.string().optional().openapi({
    description: 'Year for the chart data',
    example: '2023',
  }),
});

const responsesSchema = z.object({
  previewOrders: z.array(
    z.object({
      orderId: z.string().openapi({
        description: 'Order ID',
        example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
      }),
      price: z.number().openapi({
        description: 'Total price of the order',
        example: 199,
      }),
      status: z.string().openapi({
        description: 'Order status',
        example: 'FINISH',
      }),
      userId: z.string().openapi({
        description: 'User ID who placed the order',
        example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      }),
      products: z.array(
        z.object({
          productId: z.string().openapi({
            description: 'Product ID',
            example: 'a12bc34d-56ef-78gh-90ij-klmnopqrstuv',
          }),
          quantity: z.number().openapi({
            description: 'Quantity of the product in the order',
            example: 2,
          }),
        }),
      ),
    }),
  ),
  monthPrice: z.object({
    January: z.number().openapi({ example: 1000 }),
    February: z.number().openapi({ example: 1500 }),
    March: z.number().openapi({ example: 2000 }),
    April: z.number().openapi({ example: 2500 }),
    May: z.number().openapi({ example: 3000 }),
    June: z.number().openapi({ example: 3500 }),
    July: z.number().openapi({ example: 4000 }),
    August: z.number().openapi({ example: 4500 }),
    September: z.number().openapi({ example: 5000 }),
    October: z.number().openapi({ example: 5500 }),
    November: z.number().openapi({ example: 6000 }),
    December: z.number().openapi({ example: 6500 }),
  }),
});

registry.registerPath({
  method: 'get',
  tags: ['Vendor'],
  path: 'api/vendor/{vendorId}/dashboard',
  summary: 'Get Vendor Dashboard Data 🔒',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      vendorId: z.string().openapi({}),
    }),
    query: schema,
  },
  responses: {
    200: {
      description: 'Get vendor dashboard data successfully',
      content: {
        'application/json': {
          schema: responsesSchema,
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
  if (auth.vendor?.id !== vendorId) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden',
    });
  }

  const query = getQuery(event);
  const queryParse = schema.safeParse(query);
  if (!queryParse.success) {
    throw createError({
      statusCode: 400,
      message: 'Bad Request',
    });
  }

  const yaer = queryParse.data.yearFilter
    ? queryParse.data.yearFilter
    : new Date().getFullYear().toString();

  const allOrders = await prisma.order.findMany({
    where: {
      vendorId: vendorId,
    },
    include: {
      products: {
        select: {
          productId: true,
          quantity: true,
          product: {
            select: {
              name: true,
              price: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!allOrders) {
    throw createError({
      statusCode: 404,
      message: 'Orders not found',
    });
  }

  const previewOrders = allOrders.map((order) => ({
    orderId: order.id,
    price: order.price,
    status: order.status,
    userId: order.userId,
    products: order.products,
  }));

  const finishedOrders = allOrders.filter((order) => {
    if (order.status !== OrderStatus.FINISH) return false;
    const date = order.updatedAt;
    return date.getFullYear() === Number(yaer);
  });

  const monthPrice = [
    { month: 'Jan', totalPrice: 0 },
    { month: 'Feb', totalPrice: 0 },
    { month: 'Mar', totalPrice: 0 },
    { month: 'Apr', totalPrice: 0 },
    { month: 'May', totalPrice: 0 },
    { month: 'Jun', totalPrice: 0 },
    { month: 'Jul', totalPrice: 0 },
    { month: 'Aug', totalPrice: 0 },
    { month: 'Sep', totalPrice: 0 },
    { month: 'Oct', totalPrice: 0 },
    { month: 'Nov', totalPrice: 0 },
    { month: 'Dec', totalPrice: 0 },
  ];

  finishedOrders.forEach((order) => {
    const monthIndex = order.updatedAt.getMonth();
    if (monthPrice[monthIndex]) {
      monthPrice[monthIndex].totalPrice += order.price;
    }
  });
  return { previewOrders, monthPrice: monthPrice };
});
