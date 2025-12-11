import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { prisma } from '~/lib/prisma';
import type { AuthContextPayload } from '~/types/auth';
import { ProductStatus } from '~/prisma/generated/enums';

extendZodWithOpenApi(z);

const schema = z.object({
  productId: z.string().openapi({
    description: 'Selected ProdcutId',
    example: 'e82e0a19-ef00-4a72-820a-366ad57d3002',
  }),
  productStatus: z.enum(ProductStatus).openapi({
    description: 'Expected To Modify Status',
    example: 'INACTIVE',
  }),
});

const schemaResponses = z.object({
  status: z.enum(ProductStatus).openapi({
    description: 'Modify Product Status Succeffully',
    example: 'INACTIVE',
  }),
});

registry.registerPath({
  method: 'put',
  path: 'api/vendor/{vendorId}/product/status',
  tags: ['Product'],
  summary: 'Modify Product Status 🔒',
  description: 'Modify product release status',
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
      description: 'Modify product release status successfully',
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
      message: 'Bad Request',
    });
  }

  const { productId, productStatus } = payload.data;
  const VendorProducts = await prisma.vendor.findMany({
    where: {
      id: vendorId,
    },
    select: {
      products: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (!VendorProducts) {
    throw createError({
      statusCode: 404,
      message: 'Vendor Products Not Found',
    });
  }

  const product = prisma.product.findFirst({
    where: {
      vendorId,
      id: productId,
    },
  });

  if (!product) {
    throw createError({
      statusCode: 404,
      message: 'Product Not Found',
    });
  }

  await prisma.product.update({
    where: { id: productId, vendorId },
    data: {
      status: productStatus,
    },
  });

  return {
    status: productStatus,
  };
});
