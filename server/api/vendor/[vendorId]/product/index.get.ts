import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { prisma } from '~/lib/prisma';
import type { AuthContextPayload } from '~/types/auth';

extendZodWithOpenApi(z);

const schemaResponses = z.object({
  products: z
    .array(
      z.object({
        id: z
          .string()
          .openapi({ description: 'Product ID', example: 'prod_123' }),
        name: z
          .string()
          .openapi({ description: 'Product name', example: 'Product 1' }),
        description: z.string().openapi({
          description: 'Product description',
          example: 'Product description',
        }),
        status: z
          .string()
          .openapi({ description: 'Product status', example: 'active' }),
        price: z
          .number()
          .openapi({ description: 'Product price', example: 100 }),
        discountPrice: z
          .number()
          .openapi({ description: 'Product discount price', example: 90 }),
        quantity: z
          .number()
          .openapi({ description: 'Product quantity', example: 100 }),
        coverId: z
          .string()
          .openapi({ description: 'Product cover ID', example: '123' }),
      }),
    )
    .openapi('ProductsResponse'),
});

registry.registerPath({
  method: 'get',
  path: 'api/vendor/{vendorId}/product',
  tags: ['Product'],
  summary: 'Get Products 🔒',
  description: 'Get all products for a vendor',
  request: {
    params: z.object({
      vendorId: z.string().openapi({}),
    }),
  },
  responses: {
    200: {
      description: 'Products found',
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

  const products = await prisma.product.findMany({
    where: {
      vendorId: vendorId,
    },
    select: {
      id: true,
      name: true,
      status: true,
      description: true,
      price: true,
      discountPrice: true,
      quantity: true,
      coverId: true,
    },
  });
  if (!products) {
    throw createError({
      statusCode: 404,
      message: 'Products not found',
    });
  }

  return {
    products,
  };
});
