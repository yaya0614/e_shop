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
  path: 'api/user/log/',
  tags: ['User'],
  summary: 'Get User Log 🔒',
  security: [{ BearerAuth: [] }],
  description: 'list of user logs',
  responses: {
    200: {
      description: 'Get User Log Successfully',
      content: {
        'application/json': {
          schema: responseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
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

  const logs = await prisma.log.findMany({
    where: { userId: auth.userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!logs) {
    return { logs: [] };
  }
  return {
    logs: logs.map((log) => {
      return {
        id: log.id,
        message: log.message,
        createdAt: log.createdAt.toISOString(),
        user: {
          id: log.user.id,
          name: log.user.name,
        },
      };
    }),
  };
});
