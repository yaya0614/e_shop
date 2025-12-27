import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { prisma } from '~/lib/prisma';
extendZodWithOpenApi(z);

const schema = z.object({
  id: z.string().openapi({
    description: 'Payment ID',
    example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
  }),
});

const responseSchema = z
  .object({
    status: z.literal('success').describe('Delete Payment Success'),
  })
  .openapi('DeletePaymentResponse');

registry.registerPath({
  method: 'delete',
  path: '/api/user/payment',
  tags: ['User'],
  summary: 'Delete Payment',
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
      description: 'Delete Payment Success',
      content: {
        'application/json': {
          schema: responseSchema,
        },
      },
    },
  },
});

export default defineEventHandler(async (event) => {
  const auth = event.context.auth;
  if (!auth.authenticated || !auth.userId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  const body = await readValidatedBody(event, schema.safeParse);
  if (!body.success) {
    throw createError({
      statusCode: 400,
      message: 'Bad Request',
    });
  }

  const payment = await prisma.payment.findUnique({
    where: {
      id: body.data.id,
      userId: auth.userId,
    },
  });
  if (!payment) {
    throw createError({
      statusCode: 404,
      message: 'Payment not found',
    });
  }

  await prisma.payment.update({
    where: {
      id: body.data.id,
      userId: auth.userId,
    },
    data: {
      isDeleted: true,
      isDefault: false,
    },
  });

  return {
    status: 'success',
  };
});
