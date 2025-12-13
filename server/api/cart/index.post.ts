import type { AuthContextPayload } from '~/types/auth';
import { z } from 'zod';
import { prisma } from '~/lib/prisma';

const schema = z.object({
  productId: z.string(),
  quantity: z.number(),
});

const responseSchema = z
  .object({
    status: z.literal('success').openapi({
      description: 'Indicates the operation was successful',
      example: 'success',
    }),
  })
  .openapi('CreateCartResponse');

registry.registerPath({
  method: 'post',
  path: '/api/cart',
  tags: ['Cart'],
  summary: 'Create Cart Item 🔒',
  security: [{ bearerAuth: [] }],
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
    201: {
      description: 'Create Cart Item Successfully',
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
      description: 'Unauthorized',
    },
    404: {
      description: 'Not Found',
    },
    409: {
      description: 'Conflict',
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

  const payload = await readValidatedBody(event, schema.safeParse);
  if (!payload.success) {
    throw createError({
      statusCode: 400,
      message: payload.error.message,
    });
  }

  const product = await prisma.product.findUnique({
    where: {
      id: payload.data.productId,
    },
  });

  if (!product) {
    throw createError({
      statusCode: 404,
      message: 'Product not found',
    });
  }

  const existCartProduct = await prisma.cartProduct.findFirst({
    where: {
      productId: payload.data.productId,
      userId: auth.userId,
    },
  });

  if (existCartProduct) {
    throw createError({
      statusCode: 409,
      message: 'Product already in cart',
    });
  }

  await prisma.cartProduct.create({
    data: {
      productId: payload.data.productId,
      quantity: payload.data.quantity,
      userId: auth.userId,
    },
  });

  return {
    status: 'success',
  };
});
