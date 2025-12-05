import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { prisma } from '~/lib/prisma';
import { CouponType } from '~/prisma/generated/enums';
extendZodWithOpenApi(z);

const schema = z
  .object({
    type: z.enum(CouponType).openapi({
      description: 'Coupon type which decide discount or percentage',
      example: 'DISCOUNT',
    }),
    discount: z.int().optional().openapi({
      description: 'discount amount',
      example: 200,
    }),
    couponPercentage: z.float32().optional().openapi({
      description: 'Percentage discount',
      example: 85,
    }),
    maxPrice: z.int().optional().openapi({
      description: 'Maximum discount amount',
      example: 500,
    }),
    minPrice: z.int().optional().openapi({
      description: 'Minimum order amount required to use this coupon',
      example: 1000,
    }),
    code: z.string().optional().openapi({
      description: 'Coupon code',
      example: 'TEST666888',
    }),
  })
  .superRefine(({ type, couponPercentage, discount }, ctx) => {
    if (type == 'COUPON') {
      if (!couponPercentage) {
        ctx.addIssue({
          path: ['couponPercentage'],
          code: z.ZodIssueCode.custom,
          message: 'couponPercentage is required when type is COUPON',
        });
      }
    }
    if (type == 'DISCOUNT') {
      if (!discount) {
        ctx.addIssue({
          path: ['discount'],
          code: z.ZodIssueCode.custom,
          message: 'discount is required when type is DISCOUNT',
        });
      }
    }
  })
  .openapi('CreateCouponRequest');

const ResponseSchema = z
  .object({
    status: z.literal('success').openapi({
      description: 'Create coupon successfully message',
      example: 'success',
    }),
  })
  .openapi('CreateCouponResponse');

const errorSchema = z
  .object({
    statusCode: z.number().openapi({
      example: 400,
    }),
    message: z.string().openapi({
      example: 'Invalid Form',
    }),
  })
  .openapi('CreateCouponErrorResponses');

registry.registerPath({
  method: 'post',
  path: 'api/coupon',
  tags: ['Coupon'],
  summary: 'Create Coupon',
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
      description: 'Create Coupon Successfullt',
      content: {
        'application/json': {
          schema: ResponseSchema,
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
  const payload = await readValidatedBody(event, schema.safeParse);

  if (!payload.success) {
    throw createError({
      statusCode: 400,
      message: payload.error.message,
    });
  }

  await prisma.coupon.create({
    data: {
      type: payload.data.type,
      discountPrice: payload.data.discount,
      couponPercentage: payload.data.couponPercentage,
      maxPrice: payload.data.maxPrice,
      minPrice: payload.data.minPrice,
      code: payload.data.code,
    },
  });
  return {
    status: 'success',
  };
});
