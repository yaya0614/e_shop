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
  role: z.enum(EmployeeRole).openapi({
    description: 'Employee role',
    example: EmployeeRole.CLERK,
  }),
});

const errorSchema = z.object({
  statusCode: z.number().openapi({ example: 400 }),
  message: z.string().openapi({ example: 'Invalid employee ID' }),
});

registry.registerPath({
  method: 'put',
  tags: ['Vendor'],
  path: 'api/vendor/{vendorId}/employee',
  summary: 'Update Employee Role🔒',
  security: [{ bearerAuth: [] }],
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
    204: {
      description: 'Update employee successfully',
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: errorSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorSchema,
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: errorSchema,
        },
      },
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
      message: 'You are not allowed to update employee role for this vendor',
    });
  }

  const existingEmployee = await prisma.employee.findFirst({
    where: {
      vendorId: vendorId,
      id: payload.data.id,
    },
  });

  if (!existingEmployee) {
    throw createError({
      statusCode: 404,
      message: 'Employee not found',
    });
  }

  if (
    auth.vendor.role !== EmployeeRole.OWNER &&
    payload.data.role === EmployeeRole.OWNER
  ) {
    throw createError({
      statusCode: 403,
      message: 'You are not allowed to update employee role',
    });
  }

  await prisma.employee.update({
    where: {
      id: payload.data.id,
      vendorId: vendorId,
    },
    data: {
      role: payload.data.role,
    },
  });
});
