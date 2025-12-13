import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import type { AuthContextPayload } from '~/types/auth';
import { prisma } from '~/lib/prisma';
import { VendorStatus } from '~/prisma/generated/enums';

extendZodWithOpenApi(z);
const schema = z.object({
  userId: z.string().openapi({
    example: '9623bfd3-a9c8-4652-b9ec-3a95a83c308b',
    description: 'User ID to approve vendor application for',
  }),
  vendorId: z.string().openapi({
    example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
    description: 'Vendor ID to approve apply for',
  }),
  action: z.enum(['APPROVE', 'REJECT']).openapi({
    description: 'Action to take on the vendor apply request',
    example: 'APPROVE',
  }),
});
const responsesSchema = z.object({
  success: z.string().openapi({
    description: 'Success message',
    example: 'apply to vendor successfully!',
  }),
});

registry.registerPath({
  method: 'put',
  path: 'api/admin/vendor/apply',
  tags: ['Admin'],
  summary: 'Mange Vendor Apply Request 🔒',
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
      description: 'Update Category Name Successfully',
      content: {
        'application/json': {
          schema: responsesSchema,
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
      description:
        'Conflict - User has exceeded the maximum number of vendor applications allowed',
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

  const { userId, vendorId, action } = payload.data;

  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    include: {
      employees: { where: { role: 'OWNER' } },
    },
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
    return { success: 'rejected successfully' };
  }

  const ownerApplyCount = await prisma.employee.count({
    where: {
      userId: userId,
      role: 'OWNER',
      vendor: {
        status: VendorStatus.ACTIVE,
      },
    },
  });
  if (action === 'APPROVE' && ownerApplyCount >= 5) {
    throw createError({
      statusCode: 409,
      message:
        'User has exceeded the maximum number of vendor applications allowed',
    });
  }

  await prisma.vendor.update({
    where: {
      id: vendorId,
    },
    data: {
      status: VendorStatus.ACTIVE,
    },
  });
  return { success: 'approve successfully' };
});
