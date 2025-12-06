import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { prisma } from '~/lib/prisma';
import type { AuthContextPayload } from '~/types/auth';

extendZodWithOpenApi(z);

const schema = z
  .object({
    productName: z.string().openapi({
      description: '',
      example: '',
    }),
    productDescription: z.string().optional().openapi({
      description: '',
      example: '',
    }),
    price: z.number().int().openapi({
      description: '',
      example: '',
    }),
    discountPrice: z.number().int().optional().openapi({
      description: '',
      example: '',
    }),
    quantity: z.number().int().openapi({
      description: '',
      example: '',
    }),
    coverId: z.string().optional().openapi({
      description: '',
      example: '',
    }),
  })
  .openapi('UpdateProductPayload');

const schemaResponses = z.object({
  status: z.literal('success').openapi({
    description: 'Product info is updated successfully',
    example: 'success',
  }),
});

const errorSchema = z
  .object({
    statusCode: z.number().openapi({
      example: 400,
    }),
  })
  .openapi('ErrorResponse');

registry.registerPath({
  method: 'post',
  path: 'api/vendor/[vendorId]/',
  tags: ['Product'],
  summary: 'Update Product Info',
  description: 'Vendor update product info in store',
  request: {
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
      description: 'Update Product Info Successfully',
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
  if (auth.vendor?.id !== vendorId) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden',
    });
  }
  if (!productId) {
    throw createError({
      statusCode: 400,
      message: 'Product ID is required',
    });
  }

  const payload = await readValidatedBody(event, schema.safeParse);
  if (!payload.success) {
    throw createError({
      statusCode: 400,
      message: payload.error.message,
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

  await prisma.product.update({
    where: {
      id: productId,
    },
    data: {
      name: payload.data.productName,
      description: payload.data.productDescription ?? null,
      price: payload.data.price,
      discountPrice: payload.data.discountPrice ?? null,
      quantity: payload.data.quantity,
      coverId: payload.data.coverId ?? null,
    },
  });
  return {
    status: 'updated successfully',
  };
});
