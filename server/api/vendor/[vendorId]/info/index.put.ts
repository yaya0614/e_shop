import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { prisma } from '~/lib/prisma';
import type { AuthContextPayload } from '~/types/auth';

extendZodWithOpenApi(z);

const schema = z.object({
  name: z.string().min(1).optional().openapi({
    description: 'The name of the vendor',
    example: 'Vendor Name',
  }),
  phone: z.string().min(10).optional().openapi({
    description: 'The phone number of the vendor',
    example: '0912345678',
  }),
  email: z.email().optional().openapi({
    description: 'The email of the vendor',
    example: 'test@gmail.com',
  }),
  address: z.string().min(1).optional().openapi({
    description: 'The address of the vendor',
    example: '123, Vendor Street, Taipei, Taiwan',
  }),
});

const paramsSchema = z.object({
  vendorId: z.string().uuid().openapi({
    description: 'Vendor ID',
    example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
  }),
});

registry.registerPath({
  method: 'put',
  tags: ['Vendor'],
  path: 'api/vendor/{vendorId}/info',
  summary: 'Modify Vendor Info 🔒',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: schema,
        },
      },
    },
    params: paramsSchema,
  },
  responses: {
    204: {
      description: 'Modify Vendor Info Success',
    },
    400: {
      description: 'Bad request',
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
  const vendorId = await getValidatedRouterParams(
    event,
    paramsSchema.safeParse,
  );

  if (!vendorId.success) {
    throw createError({
      statusCode: 400,
      message: 'Bad Request',
    });
  }

  if (!auth.authenticated || !auth.userId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  if (auth.vendor?.id !== vendorId.data.vendorId) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden',
    });
  }

  const vendor = await prisma.vendor.findUnique({
    where: {
      id: vendorId.data.vendorId,
    },
  });
  if (!vendor) {
    throw createError({
      statusCode: 404,
      message: 'Vendor not found',
    });
  }

  const body = await readValidatedBody(event, schema.safeParse);
  if (!body.success) {
    throw createError({
      statusCode: 400,
      message: 'Bad Request',
    });
  }

  if (Object.keys(body.data).length === 0) {
    throw createError({
      statusCode: 400,
      message: 'No fields to update',
    });
  }

  const employee = await prisma.employee.findFirst({
    where: {
      userId: auth.userId,
      vendorId: vendorId.data.vendorId,
      role: { in: ['OWNER', 'ADMIN'] },
    },
  });

  if (!employee) {
    throw createError({ statusCode: 403, message: 'Forbidden' });
  }

  await prisma.vendor.update({
    where: {
      id: vendorId.data.vendorId,
    },
    data: body.data,
  });
  setResponseStatus(event, 204);
  return;
});
