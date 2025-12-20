import type { AuthContextPayload } from '~/types/auth';
import { z } from 'zod';
import { prisma } from '~/lib/prisma';

const schema = z.object({
  cartItemId: z.string(),
  quantity: z.number(),
});

registry.registerPath({
  method: 'put',
  path: '/api/cart',
  tags: ['Cart'],
  summary: 'Update Cart Item Quantity 🔒',
  security: [{ bearerAuth: [] }],
  responses: {
    204: {
      description: 'Update Cart Item Quantity Successfully',
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
      description: 'Storage product not enough',
    },
  },
  request: {
    body: {
      content: {
        'application/json': {
          schema: schema,
        },
      },
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

  const cartProduct = await prisma.cartProduct.findFirst({
    where: {
      id: payload.data.cartItemId,
      userId: auth.userId,
    },
    include: {
      product: {
        select: { quantity: true },
      },
    },
  });

  if (!cartProduct) {
    throw createError({
      statusCode: 404,
      message: 'Cart item not found',
    });
  }

  if (payload.data.quantity <= 0) {
    await prisma.cartProduct.delete({
      where: {
        id: cartProduct.id,
      },
    });
  } else if (payload.data.quantity > cartProduct.product.quantity) {
    throw createError({
      statusCode: 409,
      message: 'Storage product not enough',
    });
  } else {
    await prisma.cartProduct.update({
      where: {
        id: cartProduct.id,
      },
      data: {
        quantity: payload.data.quantity,
      },
    });
  }
});
