import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { prisma } from '~/lib/prisma';
import type { AuthContextPayload } from '~/types/auth';

extendZodWithOpenApi(z);

const schema = z
  .object({
    productName: z.string().openapi({
      description: 'The name of the product',
      example: '夢想之書',
    }),
    productDescription: z.string().optional().openapi({
      description: 'A brief description or introduction of the product',
      example: '這是一本幫助你追尋夢想的書籍',
    }),
    price: z.number().int().openapi({
      description: 'Product price, in TWD',
      example: 450,
    }),
    discountPrice: z.number().int().optional().openapi({
      description: 'The discounted price of the product, in TWD',
      example: 399,
    }),
    quantity: z.number().int().openapi({
      description: 'The available stock for this product',
      example: 30,
    }),
    coverId: z.string().optional().openapi({
      description: 'ID of the product cover image',
      example: 'f1e2d3c4-b5a6-7890-1234-abcd567890ef',
    }),
  })
  .openapi('UpdateProductPayload');

const schemaResponses = z.object({
  status: z.literal('success').openapi({
    description: 'Product info is updated successfully',
    example: 'success',
  }),
});

registry.registerPath({
  method: 'put',
  path: 'api/vendor/{vendorId}/product/{productId}',
  tags: ['Product'],
  summary: 'Update Product Info 🔒',
  description: 'Vendor update product info in store',
  request: {
    params: z.object({
      vendorId: z.string().openapi({}),
      productId: z.string().openapi({}),
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
      description: 'Update Product Info Successfully',
      content: {
        'application/json': {
          schema: schemaResponses,
        },
      },
    },
    400: {
      description: 'Bad Request',
    },
    401: {
      description: 'Unauthorized',
    },
    403: {
      description: 'Forbidden',
    },
    404: {
      description: 'Not Found',
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
  const productId = getRouterParam(event, 'productId');
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
  if (!productId) {
    throw createError({
      statusCode: 400,
      message: 'Product not found',
    });
  }

  const payload = await readValidatedBody(event, schema.safeParse);
  if (!payload.success) {
    throw createError({
      statusCode: 400,
      message: payload.error.message,
    });
  }
  const product = await prisma.product.findUnique({
    where: {
      id: productId,
      vendorId: vendorId,
    },
  });

  if (!product) {
    throw createError({
      statusCode: 404,
      message: 'Product not found',
    });
  }

  const userId = auth.userId;
  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: {
        id: productId,
        vendorId: vendorId,
      },
      data: {
        name: payload.data.productName,
        description: payload.data.productDescription ?? null,
        price: payload.data.price,
        discountPrice: payload.data.discountPrice ?? null,
        quantity: payload.data.quantity,
        coverId: payload.data.coverId ?? null,
      },
    });

    const log = await tx.log.create({
      data: {
        userId: userId,
        message: `Update Product ${payload.data.productName}`,
      },
    });

    await tx.productLog.create({
      data: {
        productId: productId,
        logId: log.id,
      },
    });
  });

  return {
    status: 'updated successfully',
  };
});
