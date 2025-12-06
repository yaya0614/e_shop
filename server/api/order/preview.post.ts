import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { prisma } from '~/lib/prisma';
import type { AuthContextPayload } from '~/types/auth';

extendZodWithOpenApi(z);

const PreviewOrderItem = z.object({
  productId: z.string(),
  quantity: z.int(),
});

const schema = z
  .object({
    products: z.array(PreviewOrderItem).openapi({
      description: 'List of order products',
      example: [
        {
          productId: 'ce4d9e68-3a90-4aa9-9bc9-bf6fa7c3a0d8',
          quantity: 2,
        },
      ],
    }),
    couponId: z.string().optional().openapi({
      description: 'Use Coupon Id',
      example: '1e6bcbf1-2f91-4e5c-91cf-3c12fda77b88',
    }),
  })
  .openapi('PreviewOrderQuery');

const ResponseSchame = z.object({
  price: z.int().openapi({
    description: 'Current Order Price',
    example: 3700,
  }),
});

const errorSchema = z
  .object({
    statusCode: z.number().openapi({ example: 400 }),
    message: z
      .string()
      .openapi({ example: 'Invalidate ProductId Or CouponId' }),
  })
  .openapi('ErrorResponse');

registry.registerPath({
  method: 'post',
  path: '/api/order/preview/',
  tags: ['Order'],
  summary: 'Get Order Price 🔒',
  description:
    'Preview order details and calculate total price before creating order',
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
      description: 'Get Current Order Price',
      content: {
        'application/json': {
          schema: ResponseSchame,
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

  const payload = await readValidatedBody(event, schema.safeParse);
  if (!payload.success) {
    throw createError({
      statusCode: 400,
      message: payload.error.message,
    });
  }

  const { products, couponId } = payload.data;
  let currenPrice = 0;

  for (const product of products) {
    const product_info = await prisma.product.findFirst({
      where: {
        id: product.productId,
      },
      select: {
        price: true,
        discountPrice: true,
      },
    });

    if (!product_info) {
      throw createError({
        statusCode: 404,
        message: 'Not Found ProductId',
      });
    }
    const price = product_info.discountPrice ?? product_info.price;
    currenPrice += product.quantity * price;
  }

  if (couponId) {
    const existsCoupon = await prisma.coupon.findFirst({
      where: {
        id: couponId,
      },
      select: {
        type: true,
        discountPrice: true,
        couponPercentage: true,
        maxPrice: true,
        minPrice: true,
        used: true,
      },
    });

    if (!existsCoupon) {
      throw createError({
        statusCode: 404,
        message: 'Coupon not found',
      });
    }
    if (!existsCoupon.used) {
      if (existsCoupon.minPrice && currenPrice < existsCoupon.minPrice) {
        throw createError({
          statusCode: 400,
          message: 'Coupon cannot be applied',
        });
      }
      switch (existsCoupon.type) {
        case 'COUPON':
          if (existsCoupon.couponPercentage) {
            const discount =
              currenPrice * (1 - existsCoupon.couponPercentage * 0.01);
            if (existsCoupon.maxPrice && existsCoupon.maxPrice < discount) {
              currenPrice -= existsCoupon.maxPrice;
            } else {
              currenPrice -= discount;
            }
          }
          break;
        case 'DISCOUNT':
          if (existsCoupon.discountPrice) {
            currenPrice = Math.max(0, currenPrice - existsCoupon.discountPrice);
          }
          break;
      }
    }
  }
  return currenPrice;
});
