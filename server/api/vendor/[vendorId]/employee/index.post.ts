import type { AuthContextPayload } from '~/types/auth';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { EmployeeRole } from '~/prisma/generated/enums';
import { prisma } from '~/lib/prisma';

extendZodWithOpenApi(z);

const schema = z.object({
  email: z.email().openapi({
    description: 'User email',
    example: 'john.doe@example.com',
  }),
  role: z.enum(EmployeeRole).openapi({
    description: 'Employee role',
    example: EmployeeRole.CLERK,
  }),
});

const responseSchema = z.object({
  id: z.string().openapi({
    description: 'Employee ID',
    example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
  }),
});

const errorSchema = z.object({
  statusCode: z.number().openapi({ example: 400 }),
  message: z.string().openapi({ example: 'Invalid userId' }),
});

registry.registerPath({
  method: 'post',
  tags: ['Vendor'],
  path: 'api/vendor/{vendorId}/employee',
  summary: 'Create Employee 🔒',
  security: [{ bearerAuth: [] }],
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
    201: {
      description: 'Create employee by vendor ID successfully',
      content: {
        'application/json': {
          schema: responseSchema,
        },
      },
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
    409: {
      description: 'Already exists',
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

  if (
    auth.vendor.role !== EmployeeRole.OWNER &&
    auth.vendor.role !== EmployeeRole.ADMIN
  ) {
    throw createError({
      statusCode: 403,
      message: 'You are not allowed to create employee',
    });
  }

  const vendor = await prisma.vendor.findUnique({
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

  const user = await prisma.user.findUnique({
    where: {
      email: payload.data.email,
    },
  });

  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'User not found',
    });
  }

  const existingEmployee = await prisma.employee.findFirst({
    where: {
      vendorId: vendorId,
      userId: user.id,
    },
  });

  if (existingEmployee) {
    throw createError({
      statusCode: 409,
      message: 'Employee already exists',
    });
  }

  const employee = await prisma.employee.create({
    data: {
      vendorId: vendorId,
      userId: user.id,
      role: payload.data.role,
    },
  });

  return {
    id: employee.id,
  };
});
