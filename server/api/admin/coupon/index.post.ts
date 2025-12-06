import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { prisma } from '~/lib/prisma';
import { CouponType } from '~/prisma/generated/enums';
import type { AuthContextPayload } from '~/types/auth';
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
    code: z.string().max(9).optional().openapi({
      description: 'Coupon code',
      example: 'Test789',
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
  path: 'api/admin/coupon',
  tags: ['Admin'],
  summary: 'Create Coupon 🔒',
  description:
    'Create a new coupon with specific discount or percentage. Only admin can use this endpoint',
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
      description: 'Create Coupon Successfull',
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

  if (auth.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: 'Not Admin Cannoot Create Coupon',
    });
  }

  const payload = await readValidatedBody(event, schema.safeParse);
  if (!payload.success) {
    throw createError({
      statusCode: 400,
      message: payload.error.message,
    });
  }

  const exist_code = await prisma.coupon.findUnique({
    where: {
      code: payload.data.code,
    },
  });
  if (exist_code) {
    throw createError({
      statusCode: 400,
      message: 'The code is already exist',
    });
  }

  await prisma.coupon.create({
    data: {
      type: payload.data.type,
      discountPrice: payload.data.discount ?? null,
      couponPercentage: payload.data.couponPercentage ?? null,
      maxPrice: payload.data.maxPrice ?? null,
      minPrice: payload.data.minPrice ?? null,
      code: payload.data.code,
    },
  });
  return {
    status: 'success',
  };
});
