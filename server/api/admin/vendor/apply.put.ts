import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import type { AuthContextPayload } from '~/types/auth';
import { prisma } from '~/lib/prisma';
import { VendorStatus } from '~/prisma/generated/enums';

extendZodWithOpenApi(z);
const schema = z.object({
  vendorId: z.string().openapi({
    example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
    description: 'Vendor ID to approve apply for',
  }),
  action: z.enum(['APPROVE', 'REJECT']).openapi({
    description: 'Action to take on the vendor apply request',
    example: 'APPROVE',
  }),
});

registry.registerPath({
  method: 'put',
  path: 'api/admin/vendor/apply',
  tags: ['Admin'],
  summary: 'Manage Vendor Apply Request 🔒',
  security: [{ BearerAuth: [] }],
  description: 'vendor apply request approval or reject by admin',
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
      description: 'Vendor apply request managed successfully',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
          }),
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
    409: {
      description: 'Conflict',
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
  if (auth.role !== 'ADMIN') {
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

  const { vendorId, action } = payload.data;
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
  });

  if (!vendor) {
    throw createError({ statusCode: 404, message: 'Vendor not found' });
  }

  if (vendor.status !== VendorStatus.PENDING) {
    throw createError({
      statusCode: 409,
      message: 'Vendor apply is not in pending state',
    });
  }

  if (action === 'REJECT') {
    await prisma.vendor.update({
      where: {
        id: vendorId,
      },
      data: {
        status: VendorStatus.INACTIVE,
      },
    });

    return { message: 'rejected successfully' };
  }
  if (action === 'APPROVE') {
    await prisma.vendor.update({
      where: {
        id: vendorId,
      },
      data: {
        status: VendorStatus.ACTIVE,
      },
    });
    return { message: 'approved successfully' };
  }
});
