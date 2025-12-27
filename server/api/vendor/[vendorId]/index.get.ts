import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { prisma } from '~/lib/prisma';
import type { AuthContextPayload } from '~/types/auth';
import { z } from 'zod';
import { VendorStatus } from '~/prisma/generated/enums';

extendZodWithOpenApi(z);

const responseSchema = z
  .object({
    status: z.string().openapi({
      description: 'Status',
      example: 'success',
    }),
  })
  .openapi('GetVendorResponse');

registry.registerPath({
  method: 'get',
  tags: ['Vendor'],
  path: 'api/vendor/{vendorId}',
  summary: 'Exchange Vendor Token 🔒',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      vendorId: z.string().openapi({
        description: 'Vendor ID',
        example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Exchange Vendor Token Successfully',
      content: {
        'application/json': {
          schema: responseSchema,
        },
      },
    },
    400: {
      description: 'Bad request',
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
  const vendorId = getRouterParam(event, 'vendorId');

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

  if (!vendorId) {
    throw createError({
      statusCode: 400,
      message: 'Vendor ID is required',
    });
  }

  const vendor = await prisma.vendor.findFirst({
    where: {
      id: vendorId,
    },
  });

  if (!vendor) {
    throw createError({
      statusCode: 404,
      message: 'Vendor not found',
    });
  }

  if (vendor.status !== VendorStatus.ACTIVE) {
    throw createError({
      statusCode: 403,
      message: 'Vendor is not active',
    });
  }

  const employee = await prisma.employee.findFirst({
    where: {
      vendorId: vendorId,
      userId: auth.userId,
    },
  });

  if (!employee) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden',
    });
  }

  generateAndSetToken(event, {
    userId: auth.userId,
    role: auth.role,
    vendor: {
      id: vendorId,
      role: employee.role,
    },
  });

  return {
    status: 'success',
  };
});
