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

registry.registerPath({
  method: 'get',
  path: 'api/admin/log/',
  tags: ['Admin'],
  summary: 'Get Admin Log 🔒',
  security: [{ BearerAuth: [] }],
  description: 'list of admin logs',
  responses: {
    200: {
      description: 'Get Admin Log Successfully',
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

  if (auth.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: 'Forbidden',
    });
  }

  const logs = await prisma.adminLog.findMany({
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
