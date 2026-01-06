import type { AuthContextPayload } from '~/types/auth';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { prisma } from '~/lib/prisma';
import { EmployeeRole } from '~/prisma/generated/enums';

extendZodWithOpenApi(z);

const schema = z.object({
  name: z.string().openapi({
    description: 'The name of the vendor',
    example: 'Vendor Name',
  }),
  phone: z.string().openapi({
    description: 'The phone number of the vendor',
    example: '0912345678',
  }),
  email: z.string().email().openapi({
    description: 'The email of the vendor',
    example: 'vendor@example.com',
  }),
  address: z.string().openapi({
    description: 'The address of the vendor',
    example: '123, Vendor Street, Taipei, Taiwan',
  }),
});

const responseSchema = z.object({
  id: z.string().openapi({
    description: 'The ID of the vendor',
    example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
  }),
});

registry.registerPath({
  method: 'post',
  path: 'api/vendor',
  tags: ['Vendor'],
  summary: 'Create Vendor 🔒',
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
      description: 'Vendor created successfully',
      content: {
        'application/json': {
          schema: responseSchema,
        },
      },
    },
    400: {
      description: 'Bad Request',
    },
    401: {
      description: 'Unauthorized',
    },
    409: {
      description:
        'Conflict - You already have the maximum number of vendors (5) as an owner',
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
  const userId = auth.userId;
  const body = await readValidatedBody(event, schema.safeParse);
  if (!body.success) {
    throw createError({
      statusCode: 400,
      message: 'Bad Request',
    });
  }

  const existingVendorCount = await prisma.employee.count({
    where: {
      userId,
      role: EmployeeRole.OWNER,
    },
  });

  if (existingVendorCount >= 5) {
    throw createError({
      statusCode: 409,
      message: 'You already have the maximum number of vendors (5) as an owner',
    });
  }

  await prisma.$transaction(async (tx) => {
    const vendor = await tx.vendor.create({
      data: {
        name: body.data.name,
        phone: body.data.phone,
        email: body.data.email,
        address: body.data.address,
      },
    });

    await tx.employee.create({
      data: {
        vendorId: vendor.id,
        userId: userId,
        role: EmployeeRole.OWNER,
      },
    });

    const log = await tx.log.create({
      data: {
        userId: userId,
        message: `User applied for vendor ${body.data.name}`,
      },
    });

    await tx.vendorLog.create({
      data: {
        vendorId: vendor.id,
        logId: log.id,
      },
    });

    return vendor.id;
  });
});
