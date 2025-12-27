import type { AuthContextPayload } from '~/types/auth';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { EmployeeRole } from '~/prisma/generated/enums';
import { prisma } from '~/lib/prisma';

extendZodWithOpenApi(z);

const schema = z.object({
  id: z.string().openapi({
    description: 'Employee ID',
    example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
  }),
});

registry.registerPath({
  method: 'delete',
  tags: ['Vendor'],
  path: 'api/vendor/{vendorId}/employee',
  summary: 'Delete Employee 🔒',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: schema,
        },
      },
    },
    params: z.object({
      vendorId: z.string().openapi({}),
    }),
  },
  responses: {
    204: {
      description: 'Delete employee successfully',
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
  const payload = await readValidatedBody(event, schema.safeParse);
  const allowedRoles: EmployeeRole[] = [EmployeeRole.OWNER, EmployeeRole.ADMIN];

  if (!payload.success) {
    throw createError({
      statusCode: 400,
      message: payload.error.message,
    });
  }

  const vendorId = getRouterParam(event, 'vendorId');

  if (!vendorId) {
    throw createError({
      statusCode: 400,
      message: 'Vendor ID is required',
    });
  }

  if (!auth.authenticated || !auth.userId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  if (auth.vendor?.id !== vendorId) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden',
    });
  }

  if (!allowedRoles.includes(auth.vendor.role)) {
    throw createError({
      statusCode: 403,
      message: 'You are not allowed to delete employee for this vendor',
    });
  }

  const existingEmployee = await prisma.employee.findFirst({
    where: {
      id: payload.data.id,
      vendorId: vendorId,
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!existingEmployee) {
    throw createError({
      statusCode: 404,
      message: 'Employee not found',
    });
  }

  const userId = auth.userId;

  await prisma.$transaction(async (tx) => {
    await tx.employee.delete({
      where: {
        id: payload.data.id,
        vendorId: vendorId,
      },
    });

    const log = await tx.log.create({
      data: {
        userId: userId,
        message: `Delete Employee ${existingEmployee.user.name}`,
      },
    });

    await tx.vendorLog.create({
      data: {
        vendorId: vendorId,
        logId: log.id,
      },
    });
  });
});
