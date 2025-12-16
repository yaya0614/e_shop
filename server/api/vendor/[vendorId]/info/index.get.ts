import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { prisma } from '~/lib/prisma';
import { VendorStatus, EmployeeRole } from '~/prisma/generated/enums';
import type { AuthContextPayload } from '~/types/auth';

extendZodWithOpenApi(z);
const schema = z.object({
  vendorId: z.string().openapi({
    description: 'Vendor ID',
    example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
  }),
});

const responseSchema = z
  .object({
    vendorId: z.string().openapi({
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
    ownerName: z.string().nullable().openapi({
      description: 'Owner name',
      example: '張晨',
    }),
  })
  .openapi('GetVendorInfoResponse');

registry.registerPath({
  method: 'get',
  tags: ['Vendor'],
  path: 'api/vendor/{vendorId}/info',
  summary: 'Get Vendor Info 🔒',
  security: [{ bearerAuth: [] }],
  request: {
    params: schema,
  },
  responses: {
    200: {
      description: 'Get Vendor Info Response',
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
      description: 'Not found',
    },
  },
});

export default defineEventHandler(async (event) => {
  const auth: AuthContextPayload = event.context.auth;
  const vendorId = await getValidatedRouterParams(event, schema.safeParse);

  if (!vendorId.success) {
    throw createError({
      statusCode: 400,
      message: 'Bad Request',
    });
  }

  if (!auth.authenticated || !auth.userId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  if (auth.vendor?.id !== vendorId.data.vendorId) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden',
    });
  }

  const vendorInfo = await prisma.vendor.findFirst({
    where: {
      id: vendorId.data.vendorId,
      status: VendorStatus.ACTIVE,
      isDeleted: false,
    },
    include: {
      employees: {
        where: { role: EmployeeRole.OWNER },
        take: 1,
        select: { userId: true },
      },
    },
  });

  if (!vendorInfo) {
    throw createError({
      statusCode: 404,
      message: 'Vendor not found',
    });
  }

  const ownerUser = await prisma.user.findUnique({
    where: {
      id: vendorInfo.employees[0]?.userId,
    },
    select: {
      name: true,
    },
  });

  const ownerName = ownerUser ? ownerUser.name : null;

  return {
    vendorId: vendorInfo.id,
    name: vendorInfo.name,
    phone: vendorInfo.phone,
    email: vendorInfo.email,
    address: vendorInfo.address,
    status: vendorInfo.status,
    ownerName: ownerName,
  };
});
