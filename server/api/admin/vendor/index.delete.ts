import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import type { AuthContextPayload } from '~/types/auth';
import { prisma } from '~/lib/prisma';
extendZodWithOpenApi(z);

const contentSchema = z.object({
  vendorId: z.string().openapi({
    description: 'ID of the vendor to be deleted',
    example: 'd4e5f6a7-b890-1234-cdef-567890abcedf',
  }),
});
registry.registerPath({
  method: 'delete',
  path: 'api/admin/vendor/{vendorId}',
  tags: ['Admin'],
  summary: 'Delete Vendor 🔒',
  security: [{ BearerAuth: [] }],
  description: 'delete specific vendor by admin',
  request: {
    params: contentSchema,
  },
  responses: {
    204: {
      description: 'Vendor Deleted Successfully',
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
    409: {
      description: 'Vendor Already Deleted',
    },
  },
});

export default defineEventHandler(async (event) => {
  const auth: AuthContextPayload = event.context.auth;
  const params = await getValidatedRouterParams(event, contentSchema.safeParse);

  if (!params.success) {
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
  if (auth.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: 'Forbidden',
    });
  }

  const vendorId = params.data.vendorId;
  const vendor = await prisma.vendor.findUnique({
    where: {
      id: vendorId,
    },
    select: {
      isDeleted: true,
      status: true,
    },
  });

  if (!vendor) {
    throw createError({
      statusCode: 404,
      message: 'Vendor Not Found',
    });
  }

  if (vendor.isDeleted) {
    throw createError({
      statusCode: 409,
      message: 'Vendor Already Deleted',
    });
  }
  if (vendor.status !== 'ACTIVE') {
    throw createError({
      statusCode: 409,
      message: 'Only ACTIVE vendors can be deleted',
    });
  }

  const userId = auth.userId;
  const vendorName = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: { name: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.employee.deleteMany({
      where: {
        vendorId: vendorId,
      },
    });
    await tx.vendor.update({
      where: {
        id: vendorId,
      },
      data: {
        isDeleted: true,
        status: 'INACTIVE',
      },
    });

    await tx.adminLog.create({
      data: {
        log: {
          create: {
            userId: userId,
            message: `Delete Vendor ${vendorName?.name || vendorId}`,
          },
        },
      },
    });
  });
});
