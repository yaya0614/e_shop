import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { prisma } from '~/lib/prisma';
import type { AuthContextPayload } from '~/types/auth';

extendZodWithOpenApi(z);

const schemaResponses = z.object({
  status: z.literal('deleted successfully').openapi({
    description: 'Product is deleted successfully',
    example: 'deleted successfully',
  }),
});

const errorSchema = z.object({
  statusCode: z.number().openapi({ example: 400 }),
  message: z.string().openapi({ example: 'Invalid product ID' }),
});

registry.registerPath({
  method: 'delete',
  path: 'api/vendor/[vendorId]/product/[productId]',
  tags: ['Product'],
  summary: 'Delete Product',
  description: 'Vendor delete product in store',
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
  const vendorId = getRouterParam(event, 'vendorId');
  const productId = getRouterParam(event, 'productId');
  if (!auth.authenticated || !auth.userId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }
  if (!vendorId) {
    throw createError({
      statusCode: 400,
      message: 'Vendor ID is required',
    });
  }
  if (!productId) {
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
      id: productId,
      vendorId: vendorId,
    },
  });
  if (!product) {
    throw createError({
      statusCode: 404,
      message: 'Product not found',
    });
  }
  await prisma.product.delete({
    where: {
      id: productId,
      vendorId: vendorId,
    },
  });
  return {
    status: 'deleted successfully',
  };
});
