import { z } from 'zod';
import { prisma } from '~/lib/prisma';
import { registry } from '../../utils/openapi';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import type { AuthContextPayload } from '~/types/auth';

extendZodWithOpenApi(z);

const schema = z
  .object({
    code: z.string().openapi({
      description: 'Enter Coupon Code For Get this Coupon',
      example: 'TEST200',
    }),
  })
  .openapi('UseCouponCodeQuery');

const ResponseSchame = z.object({
  status: z.literal('success').openapi({
    description: 'Use Coupon Code Successfully',
    example: 'success',
  }),
});

registry.registerPath({
  method: 'post',
  path: '/api/coupon/use-code',
  tags: ['Coupon'],
  summary: 'Use Coupon Code 🔒',
  description:
    'Validate a coupon code and return the discount information without consuming or assigning the coupon',
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
      description: 'Use Coupon Code Successfully',
      content: {
        'application/json': {
          schema: ResponseSchame,
        },
      },
    },
    400: {
      description: 'Bad Request',
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Not Found',
    },
    409: {
      description: 'Conflict - Coupon Already Used',
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
      message: 'Bad Request',
    });
  }

  const code = payload.data.code;
  const specifed_coupon = await prisma.coupon.findUnique({
    where: { code: code },
    select: {
      userId: true,
    },
  });
  if (!specifed_coupon) {
    throw createError({
      statusCode: 404,
      message: 'Coupon code does not exist',
    });
  }

  if (specifed_coupon.userId !== null) {
    throw createError({
      statusCode: 409,
      message: 'This coupon has alerady been used',
    });
  }

  await prisma.coupon.update({
    where: {
      code: code,
    },
    data: {
      userId: auth.userId,
    },
  });

  return {
    status: 'success',
  };
});
