import { prisma } from '~/lib/prisma';
import type { AuthContextPayload } from '~/types/auth';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

const schema = z.object({
  vendorId: z.string().openapi({
    description: 'Vendor ID',
    example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
  }),
  orderId: z.string().openapi({
    description: 'Order ID',
    example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
  }),
});

const responseSchema = z.object({
  id: z.string().openapi({
    description: 'Order ID',
    example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
  }),
  price: z.number().openapi({
    description: 'Price of the order',
    example: 1999,
  }),
  status: z.string().openapi({
    description: 'Status of the order',
    example: 'RECEIVED',
  }),
  createdAt: z.string().datetime().openapi({
    description: 'Creation datetime of the order',
    example: '2025-11-29T08:30:00.000Z',
  }),
  updatedAt: z.string().datetime().openapi({
    description: 'Last update datetime of the order',
    example: '2025-11-30T10:15:00.000Z',
  }),
  products: z
    .array(
      z.object({
        id: z.string().openapi({
          description: 'Product ID',
          example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
        }),
        name: z.string().openapi({
          description: 'Product name',
          example: 'Mechanical Keyboard',
        }),
        description: z.string().openapi({
          description: 'Product description',
          example: 'A mechanical keyboard with a unique design',
        }),
        price: z.number().openapi({
          description: 'Price of the product',
          example: 1999,
        }),
        coverId: z.string().openapi({
          description: 'Cover image ID of the product',
          example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
        }),
      }),
    )
    .openapi({
      description: 'Products in the order',
    }),
  vendor: z
    .object({
      id: z.string().openapi({
        description: 'Vendor ID',
        example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
      }),
      name: z.string().openapi({
        description: 'Vendor name',
        example: 'TechStore',
      }),
    })
    .openapi({
      description: 'Vendor of the order',
    }),
});

registry.registerPath({
  method: 'get',
  tags: ['Vendor'],
  path: '/api/vendor/:vendorId/order/:orderId',
  summary: 'Get order detail for a vendor 🔒',
  security: [{ bearerAuth: [] }],
  request: {
    params: schema,
  },
  responses: {
    200: {
      description: 'Get order detail for a vendor successfully',
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
    403: {
      description: 'Forbidden',
    },
    404: {
      description: 'Not Found',
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

  const vendorId = getRouterParam(event, 'vendorId');
  if (!vendorId) {
    throw createError({
      statusCode: 400,
      message: 'Vendor ID is required',
    });
  }

  if (auth.vendor?.id !== vendorId) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden',
    });
  }

  const orderId = getRouterParam(event, 'orderId');

  if (!orderId) {
    throw createError({
      statusCode: 400,
      message: 'Order ID is required',
    });
  }

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
      vendorId: vendorId,
    },
    include: {
      vendor: true,
      products: {
        include: {
          product: true,
        },
      },
      coupon: true,
      user: true,
    },
  });

  if (!order) {
    throw createError({
      statusCode: 404,
      message: 'Order not found',
    });
  }

  return {
    id: order.id,
    price: order.price,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    products: order.products.map((product) => ({
      id: product.product.id,
      name: product.product.name,
      description: product.product.description,
      price: product.product.discountPrice ?? product.product.price,
      coverId: product.product.coverId,
    })),
    vendor: {
      id: order.vendorId,
      name: order.vendor.name,
    },
    user: {
      id: order.user.id,
      name: order.user.name,
      email: order.user.email,
      address: order.user.address,
    },
    coupon: {
      id: order.coupon?.id,
      code: order.coupon?.code,
      discountPrice: order.coupon?.discountPrice,
      couponPercentage: order.coupon?.couponPercentage,
      maxPrice: order.coupon?.maxPrice,
      minPrice: order.coupon?.minPrice,
    },
  };
});
