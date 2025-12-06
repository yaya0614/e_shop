import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { prisma } from '~/lib/prisma';
import type { AuthContextPayload } from '~/types/auth';

extendZodWithOpenApi(z);

const schema = z
  .object({
    productName: z.string().openapi({
      description: '',
      example: '',
    }),
    productDescription: z.string().optional().openapi({
      description: '',
      example: '',
    }),
    price: z.number().int().openapi({
      description: '',
      example: '',
    }),
    quantity: z.number().int().openapi({
      description: '',
      example: '',
    }),
    coverId: z.string().optional().openapi({
      description: '',
      example: '',
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
  path: 'api/vendor/[vendorId]/',
  tags: ['Product'],
  summary: 'Create Product',
  description: 'Vendor create product in store',
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
  const vendorId = getRouterParam(event, 'vendorId');

  if (!auth.authenticated || !auth.userId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }
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
});
