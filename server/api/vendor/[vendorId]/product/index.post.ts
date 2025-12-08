import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { prisma } from '~/lib/prisma';
import type { AuthContextPayload } from '~/types/auth';

extendZodWithOpenApi(z);

const schema = z
  .object({
    productName: z.string().openapi({
      description: 'The name of the book',
      example: '做夢大天堂',
    }),
    productDescription: z.string().optional().openapi({
      description: 'A brief description or introduction of the book',
      example: '一封信，一段故事，在小鎮角落的雜貨店展開溫暖療癒的人生風景',
    }),
    price: z.number().int().openapi({
      description: 'Book Price',
      example: 350,
    }),
    quantity: z.number().int().openapi({
      description: 'The available stock of this book',
      example: 50,
    }),
    coverId: z.string().optional().openapi({
      description: 'The ID of the book cover image',
      example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    }),
  })
  .openapi('CreateProductPayload');

const schemaResponses = z.object({
  status: z.literal('success').openapi({
    description: 'Product is created successfully',
    example: 'success',
  }),
});

const errorSchema = z
  .object({
    statusCode: z.number().openapi({
      example: 400,
    }),
  })
  .openapi('ErrorResponse');

registry.registerPath({
  method: 'post',
  path: 'api/vendor/{vendorId}/product/',
  tags: ['Product'],
  summary: 'Create Product 🔒',
  description: 'Vendor create product in store',
  request: {
    params: z.object({
      vendorId: z.string().openapi({}),
    }),
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
      description: 'Create Product Successfully',
      content: {
        'application/json': {
          schema: schemaResponses,
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
  if (!auth.authenticated || !auth.userId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }
  const vendorId = getRouterParam(event, 'vendorId');
  if (!vendorId) {
    throw createError({
      statusCode: 400,
      message: 'Vendor ID is required',
    });
  }
  if (auth.vendor?.id !== vendorId) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden',
    });
  }

  const payload = await readValidatedBody(event, schema.safeParse);
  if (!payload.success) {
    throw createError({
      statusCode: 400,
      message: payload.error.message,
    });
  }

  await prisma.product.create({
    data: {
      vendorId: vendorId,
      name: payload.data.productName,
      description: payload.data.productDescription ?? null,
      price: payload.data.price,
      quantity: payload.data.quantity,
      coverId: payload.data.coverId ?? null,
    },
  });
  return {
    status: 'success',
  };
});
