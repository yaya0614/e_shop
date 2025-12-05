import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { prisma } from '~/lib/prisma';
import type { AuthContextPayload } from '~/types/auth';
import { z } from 'zod';
import { EmployeeRole } from '~/prisma/generated/enums';

extendZodWithOpenApi(z);

const responseSchema = z.array(
  z.object({
    id: z.string().openapi({
      description: 'Employee ID',
      example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
    }),
    userId: z.string().openapi({
      description: 'User ID',
      example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
    }),
    name: z.string().openapi({
      description: 'User name',
      example: 'John Doe',
    }),
    email: z.string().openapi({
      description: 'User email',
      example: 'john.doe@example.com',
    }),
    address: z.string().openapi({
      description: 'User address',
      example: '123 Main St, Anytown, USA',
    }),
    role: z.enum(EmployeeRole).openapi({
      description: 'Employee role',
      example: 'OWNER',
    }),
  }),
);

const errorSchema = z.object({
  statusCode: z.number().openapi({ example: 401 }),
  message: z.string().openapi({ example: 'Unauthorized' }),
});

registry.registerPath({
  method: 'get',
  tags: ['Vendor'],
  path: 'api/vendor/{vendorId}/employee',
  summary: 'Get Employees 🔒',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      vendorId: z.string().openapi({}),
    }),
  },
  responses: {
    200: {
      description: 'Get employees by vendor ID successfully',
      content: {
        'application/json': {
          schema: responseSchema,
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

  const employees = await prisma.employee.findMany({
    where: {
      vendorId: vendorId,
    },
    select: {
      id: true,
      userId: true,
      role: true,
      user: {
        select: {
          name: true,
          email: true,
          address: true,
        },
      },
    },
  });

  // Define role hierarchy (lower number = higher priority)
  const rolePriority: Record<EmployeeRole, number> = {
    [EmployeeRole.OWNER]: 0,
    [EmployeeRole.ADMIN]: 1,
    [EmployeeRole.CLERK]: 2,
  };

  return employees
    .map((item) => ({
      id: item.id,
      userId: item.userId,
      name: item.user.name,
      email: item.user.email,
      address: item.user.address,
      role: item.role,
    }))
    .sort((a, b) => {
      return rolePriority[a.role] - rolePriority[b.role];
    });
});
