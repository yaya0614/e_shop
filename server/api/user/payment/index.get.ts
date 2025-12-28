import { prisma } from '~/lib/prisma';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

const responseSchema = z
  .object({
    payments: z.array(
      z.object({
        id: z.string(),
        cardHolderName: z.string(),
        binCode: z.string(),
        lastFour: z.string(),
        type: z.string(),
        bankName: z.string(),
        expiryMonth: z.number(),
        expiryYear: z.number(),
      }),
    ),
  })
  .openapi('GetPaymentsResponse');

registry.registerPath({
  method: 'get',
  path: '/api/user/payment',
  tags: ['User'],
  summary: 'Get Payments',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Get Payments Success',
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

  const payments = await prisma.payment.findMany({
    where: {
      userId: auth.userId,
      isDeleted: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return {
    payments: payments.map((payment) => ({
      id: payment.id,
      cardHolderName: payment.cardHolderName,
      binCode: payment.binCode,
      lastFour: payment.lastFour,
      type: payment.type,
      bankName: payment.bankName,
      expiryMonth: payment.expiryMonth,
      expiryYear: payment.expiryYear,
    })),
  };
});
