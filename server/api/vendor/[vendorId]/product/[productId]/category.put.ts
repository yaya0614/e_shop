import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { prisma } from '~/lib/prisma';
import type { AuthContextPayload } from '~/types/auth';

extendZodWithOpenApi(z);

const schema = z
  .object({
    subCategoryIds: z.array(z.string().uuid()).openapi({
      description: 'Array of SubCategory IDs to bind to the product',
      example: [
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      ],
    }),
  })
  .openapi('UpdateProductCategoryPayload');

const schemaResponses = z.object({
  status: z.literal('success').openapi({
    description: 'Product subcategories updated successfully',
    example: 'success',
  }),
});

registry.registerPath({
  method: 'put',
  path: 'api/vendor/{vendorId}/product/{productId}/category',
  tags: ['Product'],
  summary: 'Update Product SubCategories 🔒',
  description: 'Vendor update product subcategories binding',
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
      description: 'Update Product SubCategories Successfully',
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
      message: 'Product ID is required',
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

  const { subCategoryIds } = payload.data;
  const subCategories = await prisma.subCategory.findMany({
    where: {
      id: {
        in: subCategoryIds,
      },
    },
  });

  if (subCategories.length !== subCategoryIds.length) {
    throw createError({
      statusCode: 400,
      message: 'Some subcategory IDs are invalid',
    });
  }

  const userId = auth.userId;

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: {
        id: productId,
      },
      data: {
        subCategorys: {
          set: subCategoryIds.map((id) => ({ id })),
        },
      },
    });

    const log = await tx.log.create({
      data: {
        userId: userId,
        message: `Update Product ${product.name} subcategories`,
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
    status: 'success',
  };
});
