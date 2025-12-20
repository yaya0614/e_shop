import type { AuthContextPayload } from '~/types/auth';
import { z } from 'zod';
import { prisma } from '~/lib/prisma';
import { ProductStatus } from '~/prisma/generated/enums';

const responseSchema = z.object({
  cartItems: z.array(
    z.object({
      id: z.string(),
      quantity: z.number(),
      product: z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        price: z.number(),
        discountPrice: z.number().optional(),
        quantity: z.number(),
        coverId: z.string().optional(),
        status: z.enum(ProductStatus).optional(),
      }),
    }),
  ),
});

registry.registerPath({
  method: 'get',
  path: '/api/cart',
  tags: ['Cart'],
  summary: 'Get Cart Items 🔒',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Get Cart Items Successfully',
      content: {
        'application/json': {
          schema: responseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
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

  const cartItems = await prisma.cartProduct.findMany({
    where: {
      userId: auth.userId,
    },
    include: {
      product: true,
    },
  });

  return {
    cartItems: cartItems.map((cartItem) => ({
      id: cartItem.id,
      quantity: cartItem.quantity,
      product: cartItem.product,
    })),
  };
});
