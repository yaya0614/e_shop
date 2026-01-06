import { prisma } from '~/lib/prisma';
import type { AuthContextPayload } from '~/types/auth';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

const responseSchema = z.object({
  logs: z.array(
    z.object({
      id: z.string(),
      message: z.string(),
      createdAt: z.string(),
      user: z.object({
        id: z.string(),
        name: z.string().nullable(),
      }),
    }),
  ),
});

const paramsSchema = z.object({
  vendorId: z.string().openapi({
    description: 'Vendor ID',
    example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
  }),
  productId: z.string().openapi({
    description: 'Product ID',
    example: 'p01a9c1b2-1a2b-4c5d-9e01-000000000001',
  }),
});

registry.registerPath({
  method: 'get',
  path: 'api/vendor/{vendorId}/product/{productId}/log/',
  tags: ['Vendor'],
  summary: 'Get Vendor Product Log 🔒',
  security: [{ BearerAuth: [] }],
  description: 'list of vendor product logs',
  request: {
    params: z.object({
      vendorId: z.string().openapi({
        description: 'Vendor ID',
        example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
      }),
      productId: z.string().openapi({
        description: 'Product ID',
        example: 'a1b2c3d4-e5f6-7890-1234-abcdef567890',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Get Vendor Log Successfully',
      content: {
        'application/json': {
          schema: responseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
    },
    403: {
      description: 'Forbidden',
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

  const params = await getValidatedRouterParams(event, paramsSchema.safeParse);
  if (!params.success) {
    throw createError({
      statusCode: 400,
      message: 'Bad Request',
    });
  }
  const vendorId = params.data.vendorId;
  const productId = params.data.productId;

  if (auth.vendor?.id !== vendorId) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden',
    });
  }

  const isVendorEmployee = await prisma.employee.findFirst({
    where: {
      userId: auth.userId,
      vendorId: vendorId,
    },
  });

  if (!isVendorEmployee) {
    throw createError({
      statusCode: 403,
      message: 'You are not an employee of this vendor',
    });
  }

  const exitisProduct = await prisma.product.findUnique({
    where: {
      id: productId,
      vendorId: vendorId,
    },
  });
  if (!exitisProduct) {
    throw createError({
      statusCode: 404,
      message: 'Product not found',
    });
  }

  const logs = await prisma.productLog.findMany({
    where: {
      productId: productId, // 只抓取屬於該產品的日誌
    },
    include: {
      log: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      log: {
        createdAt: 'desc',
      },
    },
  });

  return {
    logs: logs.map((log) => {
      return {
        id: log.id,
        message: log.log.message,
        createdAt: log.log.createdAt,
        user: {
          id: log.log.user.id,
          name: log.log.user.name,
        },
      };
    }),
  };
});
