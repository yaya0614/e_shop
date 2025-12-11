import bcrypt from 'bcrypt';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { prisma } from '~/lib/prisma';
import { registry } from '../../utils/openapi';
import { generateAndSetToken } from '../../utils/jwt';

extendZodWithOpenApi(z);

const schema = z
  .object({
    password: z.string().min(8).openapi({
      description:
        'Password (at least 8 characters, contains at least one uppercase letter)',
      example: 'MyPassword123',
    }),
    email: z.string().email().openapi({
      description: 'User email address',
      example: 'test@example.com',
    }),
  })
  .openapi('SignInRequest');

const responseSchema = z
  .object({
    token: z.string().openapi({
      description: 'JWT authentication token',
      example:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0...',
    }),
  })
  .openapi('SignInResponse');

registry.registerPath({
  method: 'post',
  path: '/api/auth/sign-in',
  tags: ['Authentication'],
  summary: 'User sign in',
  description: 'Sign in with email and password and return a JWT token',
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
      description: 'User sign in successfully',
      content: {
        'application/json': {
          schema: responseSchema,
        },
      },
    },
    400: {
      description: 'Bad request',
    },
    401: {
      description: 'Invalid email or password',
    },
  },
});

export default defineEventHandler(async (event) => {
  const payload = await readValidatedBody(event, schema.safeParse);
  if (!payload.success) {
    throw createError({
      statusCode: 400,
      message: payload.error.message,
    });
  }

  const user = await prisma.user.findUnique({
    where: {
      email: payload.data.email,
    },
  });
  if (!user || !bcrypt.compareSync(payload.data.password, user.password)) {
    throw createError({
      statusCode: 401,
      message: 'Invalid email or password',
    });
  }

  const token = generateAndSetToken(event, {
    userId: user.id,
    role: user.role,
  });

  return {
    token,
  };
});
