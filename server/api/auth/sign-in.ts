import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { prisma } from '~/lib/prisma';
import { registry } from '../../utils/openapi';

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

const errorSchema = z
  .object({
    statusCode: z.number().openapi({ example: 400 }),
    message: z.string().openapi({ example: 'Invalid email or password' }),
  })
  .openapi('ErrorResponse');

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
      content: {
        'application/json': {
          schema: errorSchema,
        },
      },
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

  const config = useRuntimeConfig(event);

  if (!config.jwtSecret) {
    throw createError({
      statusCode: 500,
      message: 'JWT secret not set in environment variables',
    });
  }

  const token = jwt.sign(
    {
      sub: user.id,
      iss: 'e-shop.ntut.edu.tw',
      role: user.role,
    },
    config.jwtSecret,
    {
      expiresIn: '7d',
    },
  );

  setCookie(event, 'auth.token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });

  return {
    token,
  };
});
