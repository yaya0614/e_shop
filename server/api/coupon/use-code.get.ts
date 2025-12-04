import { z } from 'zod';
import { prisma } from '~/lib/prisma';
import { registry } from '../../utils/openapi';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

const schema = z
  .object({
    code: z.string().openapi({
      description:
        'Coupon code entered by the user to apply a discount to the order',
      example: 'TEST200',
    }),
  })
  .openapi('UseCouponCodeQuery');

const couponResponseSchema = z
  .object({
    used: z.boolean().openapi({
      description: 'Whether the coupon has been used',
      example: false,
    }),
    discountPrice: z.number().nullable().openapi({
      description: 'Fixed discount price (if applicable)',
      example: 100,
    }),
    couponPercentage: z.number().nullable().openapi({
      description: 'Discount percentage (if applicable)',
      example: 10.5,
    }),
    maxPrice: z.number().nullable().openapi({
      description: 'Maximum discount price limit',
      example: 500,
    }),
    minPrice: z.number().nullable().openapi({
      description: 'Minimum order price to use this coupon',
      example: 1000,
    }),
    createdAt: z.date().openapi({
      description: 'Coupon creation date',
      example: '2024-01-01T00:00:00.000Z',
    }),
  })
  .openapi('CouponInfo');

const errorSchema = z
  .object({
    errorCode: z
      .enum([
        'COUPON_NOT_FOUND',
        'COUPON_EXPIRED',
        'COUPON_ALREADY_USED',
        'MIN_PRICE_NOT_REACHED',
        'INVALID_COUPON_FORMAT',
      ])
      .openapi({
        description: 'Application-specific error code',
        example: 'COUPON_NOT_FOUND',
      }),
    message: z.string().openapi({
      description: 'Human-readable error message',
      example: 'Coupon code does not exist',
    }),
  })
  .openapi('CouponErrorResponse');

registry.registerPath({
  method: 'get',
  path: '/api/coupon/use-code',
  tags: ['Coupon'],
  summary: 'Use coupon code',
  description:
    'Validate a coupon code and return the discount information without consuming or assigning the coupon',
  request: {
    query: schema,
  },
  responses: {
    200: {
      description: 'Coupon is valid and discount information is returned',
      content: {
        'application/json': {
          schema: couponResponseSchema,
        },
      },
    },
    400: {
      description: 'Coupon not available',
      content: {
        'application/json': {
          schema: errorSchema,
        },
      },
    },
    404: {
      description: 'Coupon not found',
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
  const code_result = schema.safeParse(query);

  if (!code_result.success) {
    throw createError({
      statusCode: 400,
      message: code_result.error.message,
    });
  }
  const { code } = code_result.data;
  const specific_coupon = await prisma.coupon.findFirst({
    where: {
      code: code,
    },
    select: {
      used: true,
      discountPrice: true,
      couponPercentage: true,
      maxPrice: true,
      minPrice: true,
      createdAt: true,
    },
  });
  if (!specific_coupon) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Coupon code does not exist',
      data: {
        errorCode: 'COUPON_NOT_FOUND',
        message: 'Coupon code does not exist',
      },
    });
  }
  if (specific_coupon.used) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Coupon already used',
      data: {
        errorCode: 'COUPON_ALREADY_USED',
        message: 'This coupon has already been used',
      },
    });
  }

  return specific_coupon;
});
