import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { prisma } from '~/lib/prisma';

extendZodWithOpenApi(z);
const schema = z.object({
  productId: z.string().openapi({
    description: 'Product ID',
    example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
  }),
});

const responseSchema = z
  .object({
    id: z.string().openapi({
      description: 'Product ID',
      example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
    }),
    name: z.string().openapi({
      description: 'Product name',
    }),
    description: z.string().optional().openapi({
      description: 'Product description',
      example: 'This is a product description',
    }),
    price: z.number().openapi({
      description: 'Product price',
      example: 100,
    }),
    discountPrice: z.number().optional().openapi({
      description: 'Product discount price',
      example: 90,
    }),
    quantity: z.number().openapi({
      description: 'Product quantity',
      example: 100,
    }),
    coverId: z.string().optional().openapi({
      description: 'Product cover ID',
      example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
    }),
    status: z.enum(['ACTIVE', 'INACTIVE']).openapi({
      description: 'Product status',
      example: 'ACTIVE',
    }),
    createdAt: z.date().openapi({
      description: 'Product created at',
      example: new Date(),
    }),
    updatedAt: z.date().openapi({
      description: 'Product updated at',
      example: new Date(),
    }),
    subCategorys: z.array(
      z.object({
        id: z.string().openapi({
          description: 'Sub category ID',
          example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
        }),
        name: z.string().openapi({
          description: 'Sub category name',
          example: 'Sub category name',
        }),
        categoryId: z.string().openapi({
          description: 'Category ID',
          example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
        }),
      }),
    ),
  })
  .openapi('ProductResponse');

registry.registerPath({
  method: 'get',
  path: 'api/product/{productId}',
  tags: ['Product'],
  summary: 'Get Product Detail 🔒',
  description: 'Get product detail by product ID',
  request: {
    params: z.object({
      productId: z.string().openapi({}),
    }),
  },
  responses: {
    200: {
      description: 'Product detail found',
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
    404: {
      description: 'Product not found',
    },
  },
});

export default defineEventHandler(async (event) => {
  const { data: params, success } = await getValidatedRouterParams(
    event,
    schema.safeParse,
  );

  if (!success) {
    throw createError({
      statusCode: 400,
      message: 'Bad Request',
    });
  }

  const product = await prisma.product.findUnique({
    where: {
      id: params.productId,
    },
    include: {
      subCategorys: true,
    },
  });

  if (!product) {
    throw createError({
      statusCode: 404,
      message: 'Product not found',
    });
  }

  return product;
});
