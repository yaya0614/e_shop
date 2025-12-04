import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { prisma } from '~/lib/prisma';
import { registry } from '../../utils/openapi';
import { CouponType } from '~/prisma/generated/client';

extendZodWithOpenApi(z);

const schema = z
  .object({
    userId: z.string().openapi({
      description: 'ID of the user',
      example: 'a91b32dd-d837-4d78-85f4-28378916a3dc',
    }),
  })
  .openapi('GetOrderDetailQuery');

const responsesSchema = z
  .object({
    type: z.enum(CouponType).openapi({
      description: 'Type of coupon',
      example: 'DISCOUNT',
    }),
    discountPrice: z.int().optional().openapi({
      description:
        'Fixed discount amount applied to the order (only applicable for DISCOUNT type coupons)',
      example: 200,
    }),

    couponPercentage: z.float32().optional().openapi({
      description:
        'Percentage discount applied to the order (only applicable for COUPON type coupons)',
      example: 10,
    }),

    maxPrice: z.int().optional().openapi({
      description: 'Maximum discount amount allowed when using the coupon',
      example: 300,
    }),

    minPrice: z.int().optional().openapi({
      description: 'Minimum order amount required to use the coupon',
      example: 1000,
    }),

    used: z.boolean().openapi({
      description: 'Indicates whether the coupon has already been used',
      example: false,
    }),
  })
  .openapi('CouponDetailResponses');

const errorSchema = z
  .object({
    statusCode: z.number().openapi({ example: 400 }),
    message: z.string().openapi({ example: 'Not Found userId' }),
  })
  .openapi('ErrorResponse');

registry.registerPath({
  method: 'get',
  path: '/api/coupon',
  tags: ['Coupon'],
  summary: "Get user's coupon",
  description: 'Get all available coupons for a specific user',
  request: {
    query: schema,
  },
  responses: {
    200: {
      description: 'Get order history successfully',
      content: {
        'application/json': {
          schema: responsesSchema,
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
  },
});

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const userId_result = schema.safeParse(query);

  if (!userId_result.success) {
    throw createError({
      statusCode: 400,
      message: userId_result.error.message,
    });
  }
  const { userId } = userId_result.data;
  const available_coupon = await prisma.coupon.findMany({
    where: {
      userId: userId,
      used: false,
    },
    select: {
      type: true,
      discountPrice: true,
      couponPercentage: true,
      maxPrice: true,
      minPrice: true,
      used: true,
      code: true,
    },
  });

  return available_coupon;
});
