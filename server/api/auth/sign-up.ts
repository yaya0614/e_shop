import bcrypt from 'bcrypt';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { prisma } from '~/lib/prisma';
import { registry } from '../../utils/openapi';

extendZodWithOpenApi(z);

const schema = z
  .object({
    name: z.string().min(1).openapi({
      description: 'User name',
      example: 'Test User',
    }),
    password: z.string().min(8).openapi({
      description:
        'Password (at least 8 characters, contains at least one uppercase letter)',
      example: 'MyPassword123',
    }),
    email: z.string().email().openapi({
      description: 'User email address',
      example: 'test@example.com',
    }),
    address: z.string().optional().openapi({
      description: 'User address (optional)',
      example: '123 Main Street, Taipei',
    }),
  })
  .openapi('SignUpRequest');

const responseSchema = z
  .object({
    token: z.string().openapi({
      description: 'JWT authentication token',
      example:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0...',
    }),
  })
  .openapi('SignUpResponse');

registry.registerPath({
  method: 'post',
  path: '/api/auth/sign-up',
  tags: ['Authentication'],
  summary: 'User sign up',
  description: 'Create a new user account and return a JWT token',
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
      description: 'User sign up successfully',
      content: {
        'application/json': {
          schema: responseSchema,
        },
      },
    },
    400: {
      description: 'Bad request',
    },
    409: {
      description: 'User already exists',
    },
    500: {
      description: 'Internal server error',
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

  const password = payload.data.password.trim();
  if (password.length < 8 || password.toLowerCase() === password) {
    throw createError({
      statusCode: 400,
      message:
        'Password must be at least 8 characters long and at least one uppercase letter',
    });
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: payload.data.email,
    },
  });
  if (existingUser) {
    throw createError({
      statusCode: 409,
      message: 'User already exists',
    });
  }

  const user = await prisma.user.create({
    data: {
      name: payload.data.name,
      email: payload.data.email,
      password: bcrypt.hashSync(password, 10),
      address: payload.data.address,
    },
  });

  const config = useRuntimeConfig(event);

  if (!config.jwtSecret) {
    throw createError({
      statusCode: 500,
      message: 'JWT secret not set in environment variables',
    });
  }

  const token = generateAndSetToken(event, {
    userId: user.id,
    role: user.role,
  });

  await prisma.log.create({
    data: {
      userId: user.id,
      message: `User ${user.email} signed up`,
    },
  });

  return {
    token,
  };
});
