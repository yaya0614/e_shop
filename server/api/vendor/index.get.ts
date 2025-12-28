import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { prisma } from '~/lib/prisma';
import type { AuthContextPayload } from '~/types/auth';
import { z } from 'zod';
import { VendorStatus } from '~/prisma/generated/enums';

extendZodWithOpenApi(z);

const responseSchema = z
  .object({
    vendors: z.array(
      z.object({
        id: z.string().openapi({
          description: 'Vendor ID',
          example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
        }),
        name: z.string().openapi({
          description: 'Vendor name',
          example: 'NTUT Store',
        }),
        phone: z.string().openapi({
          description: 'Vendor phone',
          example: '0912345678',
        }),
        email: z.string().openapi({
          description: 'Vendor email',
          example: 'ntut@store.com',
        }),
        address: z.string().openapi({
          description: 'Vendor address',
          example: '123, NTUT Road, Taipei, Taiwan',
        }),
        status: z.enum(VendorStatus).openapi({
          description: 'Vendor status',
          example: 'ACTIVE',
        }),
      }),
    ),
  })
  .openapi('GetVendorsResponse');

registry.registerPath({
  method: 'get',
  tags: ['Vendor'],
  path: 'api/vendor',
  summary: 'Get vendor list 🔒',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Get vendor list successfully',
      content: {
        'application/json': {
          schema: responseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
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

  if (!auth.userId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  const employees = await prisma.employee.findMany({
    where: {
      userId: auth.userId,
    },
    select: {
      role: true,
      vendor: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          address: true,
          status: true,
        },
      },
    },
  });

  return {
    vendors: employees.map((employee) => {
      return {
        id: employee.vendor.id,
        name: employee.vendor.name,
        phone: employee.vendor.phone,
        email: employee.vendor.email,
        address: employee.vendor.address,
        role: employee.role,
        status: employee.vendor.status,
      };
    }),
  };
});
