import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { prisma } from '~/lib/prisma';
import { registry } from '../../utils/openapi';
import type { AuthContextPayload } from '~/types/auth';

extendZodWithOpenApi(z);

const OrderProductSchema = z.object({
  productId: z.string(),
  quantity: z.number(),
});

const schema = z
  .object({
    products: z.array(OrderProductSchema).openapi({
      description: 'List of order products',
      example: [
        {
          productId: 'b332ab67-2b11-4a88-87ef-c53a88d9dd11',
          quantity: 2,
        },
      ],
    }),

    couponId: z.string().optional().openapi({
      description: 'Coupon object applied to the order',
      example: 'f98afd90-8410-4c18-9c5d-b993a9da65e1',
    }),
  })
  .openapi('CreateOrderRequest');

const responseSchema = z
  .object({
    status: z.literal('success').openapi({
      description: 'Indicates the operation was successful',
      example: 'success',
    }),
  })
  .openapi('CreateOrderResponse');

const errorSchema = z
  .object({
    statusCode: z.number().openapi({ example: 400 }),
    message: z.string().openapi({ example: 'Invalid userId' }),
  })
  .openapi('ErrorResponse');

registry.registerPath({
  method: 'post',
  path: '/api/order',
  tags: ['Order'],
  summary: 'Create Order 🔒',
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
    200: {
      description: 'Create Order Successfully',
      content: {
        'application/json': {
          schema: responseSchema,
        },
      },
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: errorSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized - Invalid or missing token',
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

  if (!auth.authenticated) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  if (!auth.userId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  const userId = auth.userId;

  const payload = await readValidatedBody(event, schema.safeParse);
  if (!payload.success) {
    throw createError({
      statusCode: 400,
      message: payload.error.message,
    });
  }

  const products = await prisma.product.findMany({
    where: {
      id: {
        in: payload.data.products.map((product) => product.productId),
      },
    },
  });

  if (products.length !== payload.data.products.length) {
    throw createError({
      statusCode: 404,
      message: 'some product not found',
    });
  }

  const quantityByProductId = new Map(
    payload.data.products.map(({ productId, quantity }) => [
      productId,
      quantity,
    ]),
  );

  products.map((product) => {
    const quantity = quantityByProductId.get(product.id) ?? 0; // payload
    if (quantity > product.quantity) {
      throw createError({
        statusCode: 409,
        message: ' storage product not enough',
      });
    }
  });

  let price = products.reduce((total, product) => {
    const quantity = quantityByProductId.get(product.id) ?? 0;
    return total + product.price * quantity;
  }, 0);

  if (payload.data.couponId) {
    const existCoupon = await prisma.coupon.findFirst({
      where: {
        id: payload.data.couponId,
      },
    });

    if (!existCoupon) {
      throw createError({
        statusCode: 404,
        message: 'Coupon not found',
      });
    }

    if (existCoupon.minPrice && price < existCoupon.minPrice) {
      throw createError({
        statusCode: 400,
        message: 'Coupon cannot be applied',
      });
    }

    switch (existCoupon.type) {
      case 'COUPON':
        if (existCoupon.couponPercentage) {
          const discounted = price * (1 - existCoupon.couponPercentage);
          if (existCoupon.maxPrice && existCoupon.maxPrice < discounted) {
            price = price - existCoupon.maxPrice;
          } else {
            price = price - discounted;
          }
        }
        break;
      case 'DISCOUNT':
        if (existCoupon.discountPrice) {
          price = Math.max(0, price - existCoupon.discountPrice);
        }
        break;
    }
  }

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        price: price,
        status: 'RECEIVED',
        userId: userId,
        couponId: payload.data.couponId,
      },
    });

    await tx.orderProduct.createMany({
      data: payload.data.products.map((product) => {
        return {
          quantity: product.quantity,
          productId: product.productId,
          orderId: order.id,
        };
      }),
    });

    const promises = [];

    for (const product of products) {
      const quantity = quantityByProductId.get(product.id) ?? 0;
      promises.push(
        tx.product.update({
          where: {
            id: product.id,
          },
          data: {
            quantity: product.quantity - quantity,
          },
        }),
      );
    }

    await Promise.all(promises);
  });

  return {
    status: 'success',
  };
});
