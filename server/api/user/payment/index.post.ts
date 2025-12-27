import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { mockPaymentSDK } from '~/lib/mockPaymentSDK';
import { prisma } from '~/lib/prisma';

extendZodWithOpenApi(z);

const schema = z
  .object({
    cardNumber: z.string().describe('Card Number').openapi({
      example: '4242424242424242',
    }),
    cardHolderName: z.string().describe('Card Holder Name').openapi({
      example: 'John Doe',
    }),
    expiryMonth: z.number().describe('Expiry Month').openapi({
      example: 12,
    }),
    expiryYear: z.number().describe('Expiry Year').openapi({
      example: 2027,
    }),
    cvv: z.string().describe('CVV Code').openapi({
      example: '123',
    }),
  })
  .openapi('BindCardRequest');

const responseSchema = z
  .object({
    status: z.literal('success').describe('Bind Card Success'),
  })
  .openapi('CreatePaymentResponse');

registry.registerPath({
  method: 'post',
  path: '/api/user/payment',
  tags: ['User'],
  summary: 'Create Payment',
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
      description: 'Bind Card Success',
      content: {
        'application/json': {
          schema: responseSchema,
        },
      },
    },
    400: {
      description: 'Invalid Request',
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Not Found',
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

  const prime = await mockPaymentSDK.getPrime({
    cardNumber: body.data.cardNumber,
    cardHolderName: body.data.cardHolderName,
    expiryMonth: body.data.expiryMonth,
    expiryYear: body.data.expiryYear,
    cvv: body.data.cvv,
  });

  if (!prime.success) {
    throw createError({
      statusCode: 400,
      message: prime.message,
    });
  }

  const existingCard = await prisma.payment.findFirst({
    where: {
      userId: auth.userId,
      binCode: prime.cardInfo.binCode,
      lastFour: prime.cardInfo.lastFour,
      isDeleted: false,
    },
  });

  if (existingCard) {
    throw createError({
      statusCode: 409,
      message: 'Card already exists',
    });
  }

  const bindCard = await mockPaymentSDK.bindCard(prime.prime, auth.userId);

  if (!bindCard.success) {
    throw createError({
      statusCode: 400,
      message: bindCard.message,
    });
  }

  await prisma.payment.create({
    data: {
      recTradeId: bindCard.data.recTradeId,
      customerId: bindCard.data.customerId,
      eventId: bindCard.data.eventId,
      token: bindCard.data.token,
      key: bindCard.data.key,
      identifier: bindCard.data.identifier,
      cardHolderName: body.data.cardHolderName,
      binCode: bindCard.data.cardInfo.binCode,
      lastFour: bindCard.data.cardInfo.lastFour,
      type: bindCard.data.cardInfo.type,
      bankName: bindCard.data.cardInfo.issuer,
      expiryMonth: body.data.expiryMonth,
      expiryYear: body.data.expiryYear,
      userId: auth.userId,
    },
  });

  return {
    status: 'success',
  };
});
