import type { AuthContextPayload } from '~/types/auth';
import { z } from 'zod';
import { OrderStatus } from '~/prisma/generated/enums';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { prisma } from '~/lib/prisma';

extendZodWithOpenApi(z);

const paramsSchema = z.object({
  orderId: z.string().openapi({
    description: 'Order ID',
    example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
  }),
  vendorId: z.string().openapi({
    description: 'Vendor ID',
    example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
  }),
});

const bodySchema = z.object({
  status: z.enum(Object.values(OrderStatus)).openapi({
    description: 'Order status',
    example: 'RECEIVED',
  }),
});

const responseSchema = z.object({
  status: z.string().openapi({
    description: 'Status of the order',
    example: 'success',
  }),
});

registry.registerPath({
  method: 'put',
  tags: ['Vendor'],
  path: '/api/vendor/:vendorId/order/:orderId',
  summary: 'Update order status for a vendor 🔒',
  security: [{ bearerAuth: [] }],
  request: {
    params: paramsSchema,
    body: {
      content: {
        'application/json': {
          schema: bodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Update order status successfully',
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
      description: 'Order not found',
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

  const orderId = getRouterParam(event, 'orderId');
  if (!orderId) {
    throw createError({
      statusCode: 400,
      message: 'Order ID is required',
    });
  }

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
      vendorId: vendorId,
    },
  });

  if (!order) {
    throw createError({
      statusCode: 404,
      message: 'Order not found',
    });
  }

  const payload = await readValidatedBody(event, bodySchema.safeParse);
  if (!payload.success) {
    throw createError({
      statusCode: 400,
      message: 'Bad Request',
    });
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: payload.data.status },
  });

  return {
    status: 'updated successfully',
  };
});
