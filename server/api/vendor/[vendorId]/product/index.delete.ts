import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { prisma } from '~/lib/prisma';
import type { AuthContextPayload } from '~/types/auth';

extendZodWithOpenApi(z);

const schema = z.object({
  productId: z.string().openapi({
    description: 'Product ID',
    example: '1234567890',
  }),
});

const schemaResponses = z.object({
  status: z.literal('deleted successfully').openapi({
    description: 'Product is deleted successfully',
    example: 'deleted successfully',
  }),
});

registry.registerPath({
  method: 'delete',
  path: 'api/vendor/{vendorId}/product/{productId}',
  tags: ['Product'],
  summary: 'Delete Product 🔒',
  description: 'Vendor delete product in store',
  request: {
    params: z.object({
      vendorId: z.string().openapi({}),
    }),
    body: {
      content: {
        'application/json': {
          schema: schema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Delete Product Successfully',
      content: {
        'application/json': {
          schema: schemaResponses,
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
  const payload = await readValidatedBody(event, schema.safeParse);
  if (!payload.success) {
    throw createError({
      statusCode: 400,
      message: 'Bad Request',
    });
  }
  if (!vendorId) {
    throw createError({
      statusCode: 400,
      message: 'Vendor ID is required',
    });
  }
  if (!payload.data.productId) {
    throw createError({
      statusCode: 400,
      message: 'Product ID is required',
    });
  }
  if (auth.vendor?.id !== vendorId) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden',
    });
  }
  const product = await prisma.product.findUnique({
    where: {
      id: payload.data.productId,
      vendorId: vendorId,
    },
  });
  if (!product) {
    throw createError({
      statusCode: 404,
      message: 'Product not found',
    });
  }

  const userId = auth.userId;
  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: {
        id: payload.data.productId,
        vendorId: vendorId,
      },
      data: {
        isDeleted: true,
      },
    });

    const log = await tx.log.create({
      data: {
        userId: userId,
        message: `Delete Product ${product.name}`,
      },
    });

    await tx.productLog.create({
      data: {
        productId: payload.data.productId,
        logId: log.id,
      },
    });
  });

  return {
    status: 'deleted successfully',
  };
});
