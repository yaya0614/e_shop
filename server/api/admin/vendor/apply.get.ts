import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import type { AuthContextPayload } from '~/types/auth';
import { prisma } from '~/lib/prisma';
import { VendorStatus } from '~/prisma/generated/enums';
extendZodWithOpenApi(z);

const responsesSchema = z.array(
  z.object({
    id: z.string().openapi({
      description: 'Vendor Id',
      example: 'd4e5f6a7-b890-1234-cdef-567890abcedf',
    }),
    name: z.string().openapi({
      description: 'Vendor Name',
      example: '心靈書坊',
    }),
    email: z.string().openapi({
      description: 'Vendor Email',
      example: 'BobVendor@gmail.com',
    }),
    status: z.enum(VendorStatus).openapi({
      description: 'Vendor Status',
      example: 'PENDING',
    }),
    owner: z.object({
      userId: z.string().openapi({
        description: 'Owner User Id',
        example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567007',
      }),
    }),
  }),
);

registry.registerPath({
  method: 'get',
  path: 'api/admin/vendor/apply',
  tags: ['Admin'],
  summary: 'Get Vendor Apply Request 🔒',
  security: [{ BearerAuth: [] }],
  description: 'Get list of vendor apply requests for admin review',
  responses: {
    200: {
      description: 'Get Vendor Apply Requests Successfully',
      content: {
        'application/json': {
          schema: responsesSchema,
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
  if (!auth.authenticated) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }
  if (auth.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: 'Forbidden',
    });
  }

  const vendorRequests = await prisma.vendor.findMany({
    where: {
      status: VendorStatus.Pending,
    },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      employees: {
        where: { role: 'OWNER' },
        select: {
          userId: true,
        },
      },
    },
  });

  return vendorRequests;
});
