import { prisma } from '~/lib/prisma';
import type { AuthContextPayload } from '~/types/auth';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

const responseSchema = z.object({
  logs: z.array(
    z.object({
      id: z.string(),
      message: z.string(),
      createdAt: z.string(),
      user: z.object({
        id: z.string(),
        name: z.string().nullable(),
      }),
    }),
  ),
});

const paramsSchema = z.object({
  vendorId: z.string().openapi({
    description: 'Vendor ID',
    example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
  }),
});

registry.registerPath({
  method: 'get',
  path: 'api/vendor/{vendorId}/log/',
  tags: ['Vendor'],
  summary: 'Get Vendor Log 🔒',
  security: [{ BearerAuth: [] }],
  description: 'list of vendor logs',
  request: {
    params: z.object({
      vendorId: z.string().openapi({
        description: 'Vendor ID',
        example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Get Vendor Log Successfully',
      content: {
        'application/json': {
          schema: responseSchema,
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
  if (!auth.authenticated || !auth.userId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  const { data: params, success } = await getValidatedRouterParams(
    event,
    paramsSchema.safeParse,
  );

  if (!success) {
    throw createError({
      statusCode: 400,
      message: 'Bad Request',
    });
  }

  const vendorId = params?.vendorId;
  if (!vendorId) {
    throw createError({
      statusCode: 400,
      message: 'Bad Request',
    });
  }

  if (auth.vendor?.id !== vendorId) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden',
    });
  }

  const isVendorEmployee = await prisma.employee.findFirst({
    where: {
      userId: auth.userId,
      vendorId: vendorId,
    },
  });

  if (!isVendorEmployee) {
    throw createError({
      statusCode: 403,
      message: 'You are not an employee of this vendor',
    });
  }

  const logs = await prisma.vendorLog.findMany({
    include: {
      log: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      log: {
        createdAt: 'desc',
      },
    },
  });

  return {
    logs: logs.map((log) => {
      return {
        id: log.id,
        message: log.log.message,
        createdAt: log.log.createdAt,
        user: {
          id: log.log.user.id,
          name: log.log.user.name,
        },
      };
    }),
  };
});
