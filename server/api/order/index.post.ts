import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { prisma } from '~/lib/prisma';
import { registry } from '../../utils/openapi';
import type { AuthContextPayload } from '~/types/auth';

extendZodWithOpenApi(z);

const OrderProductSchema = z.object({
  productId: z.string(),
  quantity: z.number(),
});

const schema = z
  .object({
    products: z.array(OrderProductSchema).openapi({
      description: 'List of order products',
      example: [
        {
          productId: '7023a6bf-6cd6-4bec-8de0-9a97d7b56002',
          quantity: 2,
        },
        {
          productId: '91f2a3cb-6e3b-45ad-8af1-8d23c5bbf912',
          quantity: 2,
        },
      ],
    }),

    couponId: z.uuid().optional().openapi({
      description: 'Coupon object applied to the order',
      example: 'f98afd90-8410-4c18-9c5d-b993a9da65e1',
    }),
  })
  .openapi('CreateOrderRequest');

const responseSchema = z
  .object({
    orderId: z.string().openapi({
      description: 'Order ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
  })
  .openapi('CreateOrderResponse');

registry.registerPath({
  method: 'post',
  path: '/api/order',
  tags: ['Order'],
  summary: 'Create Order 🔒',
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
    200: {
      description: 'Create Order Successfully',
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
      description: 'Unauthorized',
    },
    404: {
      description: 'Not found',
    },
    409: {
      description: 'Conflict - Insufficient product quantity',
    },
    422: {
      description: 'Unprocessable Entity - Products from different vendors',
    },
  },
});

export default defineEventHandler(async (event) => {
  const auth: AuthContextPayload = event.context.auth;

  if (!auth.authenticated) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  if (!auth.userId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  const userId = auth.userId;

  const payload = await readValidatedBody(event, schema.safeParse);
  if (!payload.success) {
    throw createError({
      statusCode: 400,
      message: payload.error.message,
    });
  }

  const products = await prisma.product.findMany({
    where: {
      id: {
        in: payload.data.products.map((product) => product.productId),
      },
    },
    select: {
      id: true,
      price: true,
      discountPrice: true,
      quantity: true,
      vendorId: true,
    },
  });

  if (products.length !== payload.data.products.length) {
    throw createError({
      statusCode: 404,
      message: 'some product not found',
    });
  }
  const productVendorAmount = new Set(
    products.map((product) => product.vendorId),
  ).size;

  if (productVendorAmount > 1) {
    throw createError({
      statusCode: 422,
      message: 'All products must belong to the same vendor',
    });
  }

  const quantityByProductId = new Map(
    payload.data.products.map(({ productId, quantity }) => [
      productId,
      quantity,
    ]),
  );

  products.map((product) => {
    const quantity = quantityByProductId.get(product.id) ?? 0; // payload
    if (quantity > product.quantity) {
      throw createError({
        statusCode: 409,
        message: ' storage product not enough',
      });
    }
  });

  let price = products.reduce((total, product) => {
    const quantity = quantityByProductId.get(product.id) ?? 0;
    const productPrice = product.discountPrice ?? product.price;
    return total + productPrice * quantity;
  }, 0);

  if (payload.data.couponId) {
    const existCoupon = await prisma.coupon.findFirst({
      where: {
        id: payload.data.couponId,
      },
    });

    if (!existCoupon) {
      throw createError({
        statusCode: 404,
        message: 'Coupon not found',
      });
    }

    if (existCoupon.minPrice && price < existCoupon.minPrice) {
      throw createError({
        statusCode: 400,
        message: 'Coupon cannot be applied',
      });
    }

    switch (existCoupon.type) {
      case 'COUPON':
        if (existCoupon.couponPercentage) {
          const discounted = price * (1 - existCoupon.couponPercentage);
          if (existCoupon.maxPrice && existCoupon.maxPrice < discounted) {
            price = price - existCoupon.maxPrice;
          } else {
            price = price - discounted;
          }
        }
        break;
      case 'DISCOUNT':
        if (existCoupon.discountPrice) {
          price = Math.max(0, price - existCoupon.discountPrice);
        }
        break;
    }
  }
  const orderVendorIds = await prisma.product.findMany({
    where: {
      id: {
        in: payload.data.products.map((product) => product.productId),
      },
    },
    select: {
      vendorId: true,
    },
  });

  if (
    new Set(orderVendorIds.map((orderVendor) => orderVendor.vendorId)).size > 1
  ) {
    throw createError({
      statusCode: 422,
      message: 'All products must belong to the same vendor',
    });
  }

  let orderId = '';

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        price: price,
        status: 'RECEIVED',
        userId: userId,
        couponId: payload.data.couponId,
        vendorId: orderVendorIds[0].vendorId,
      },
    });
    orderId = order.id;

    await tx.orderProduct.createMany({
      data: payload.data.products.map((product) => {
        return {
          quantity: product.quantity,
          productId: product.productId,
          orderId: order.id,
        };
      }),
    });

    const promises = [];

    for (const product of products) {
      const quantity = quantityByProductId.get(product.id) ?? 0;
      promises.push(
        tx.product.update({
          where: {
            id: product.id,
          },
          data: {
            quantity: product.quantity - quantity,
          },
        }),
      );
    }
    await Promise.all(promises);

    if (payload.data.couponId && payload.data.couponId !== '') {
      await tx.coupon.update({
        where: {
          id: payload.data.couponId,
        },
        data: {
          used: true,
        },
      });
    }

    await tx.log.create({
      data: {
        userId: userId,
        message: `User created order ${order.id} with ${payload.data.products.length} products`,
      },
    });
  });

  return {
    orderId: orderId,
  };
});
