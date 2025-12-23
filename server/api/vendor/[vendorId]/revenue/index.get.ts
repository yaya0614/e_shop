import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import type { AuthContextPayload } from '~/types/auth';
import { prisma } from '~/lib/prisma';
import { OrderStatus } from '~/prisma/generated/enums';
import ExcelJS from 'exceljs';

extendZodWithOpenApi(z);

const paramsSchema = z.object({
  vendorId: z.string().openapi({
    description: 'Vendor Id',
    example: '02b8ab77-4df1-4e1d-bc7b-7306f0e4e6a1',
  }),
});

const querySchema = z.object({
  specificMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .openapi({
      description: 'Specific revenue month',
      example: '2024-01',
    }),
});

registry.registerPath({
  method: 'get',
  tags: ['Vendor'],
  path: 'api/vendor/{vendorId}/revenue',
  summary: 'Get Vendor Revenue Report 🔒',
  security: [{ BearerAuth: [] }],
  description: 'Get revenue report for a specific vendor',
  request: {
    params: paramsSchema,
    query: querySchema,
  },
  responses: {
    200: {
      description: 'Excel file',
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
    404: {
      description: 'Not Found',
    },
  },
});

export default defineEventHandler(async (event) => {
  const auth: AuthContextPayload = event.context.auth;
  const params = await getValidatedRouterParams(event, paramsSchema.safeParse);

  if (!auth.authenticated || !auth.userId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }

  if (!params.success) {
    throw createError({
      statusCode: 400,
      message: 'Bad Request',
    });
  }

  if (auth.vendor?.id !== params.data.vendorId) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden',
    });
  }

  const query = await getValidatedQuery(event, querySchema.safeParse);
  if (!query.success) {
    throw createError({
      statusCode: 400,
      message: 'Bad Request',
    });
  }

  function getMonthRange(month: string): { gte: Date; lt: Date } {
    const [year, monthIndex] = month.split('-').map(Number);

    if (!year || !monthIndex) {
      throw createError({
        statusCode: 400,
        message: 'Invalid month format',
      });
    }

    const start = new Date(Date.UTC(year, monthIndex - 1, 1));
    const end = new Date(Date.UTC(year, monthIndex, 1));

    return { gte: start, lt: end };
  }

  const monthRange = query.data.specificMonth
    ? getMonthRange(query.data.specificMonth)
    : undefined;

  const vendorFinishedOrders = await prisma.vendor.findUnique({
    where: {
      id: params.data.vendorId,
    },
    select: {
      name: true,
      orders: {
        where: {
          status: OrderStatus.FINISH,
          ...(monthRange && {
            updatedAt: {
              lt: monthRange.lt,
              gte: monthRange.gte,
            },
          }),
        },
        select: {
          id: true,
          updatedAt: true,
          price: true,
          products: {
            select: {
              quantity: true,
              product: {
                select: {
                  name: true,
                  price: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!vendorFinishedOrders) {
    throw createError({
      statusCode: 404,
      message: 'Vendor not found',
    });
  }

  if (vendorFinishedOrders.orders.length === 0) {
    throw createError({
      statusCode: 409,
      message: 'this month not have orders',
    });
  }

  const nameVendor = vendorFinishedOrders.name;
  const revenueDate = query.data.specificMonth;

  const ProductSellCount = new Map<
    string,
    { quantity: number; price: number }
  >();

  vendorFinishedOrders?.orders.forEach((order) => {
    order.products.forEach((productSold) => {
      const productName = productSold.product.name;
      const productPrice = productSold.product.price;
      const quantitySold = productSold.quantity;

      if (ProductSellCount.has(productName)) {
        const existing = ProductSellCount.get(productName)!;
        ProductSellCount.set(productName, {
          quantity: existing.quantity + quantitySold,
          price: productPrice,
        });
      } else {
        ProductSellCount.set(productName, {
          quantity: quantitySold,
          price: productPrice,
        });
      }
    });
  });

  const sortedProductSellCount = Array.from(ProductSellCount.entries()).sort();

  const vendorOrderPrices = vendorFinishedOrders.orders.map(
    (order) => order.price,
  );

  const totalRevenue = vendorOrderPrices.reduce(
    (sum, orderPrice) => sum + orderPrice,
    0,
  );

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('商家財報');
  const worksheet2 = workbook.addWorksheet('商家訂單總覽');

  worksheet.columns = [
    { header: '名稱', key: 'name', width: 30 },
    { header: '數量', key: 'quantity', width: 10 },
    { header: '價格', key: 'Price', width: 10 },
    { header: '商品總價', key: 'ProductPrice', width: 15 },
  ];

  worksheet2.columns = [
    { header: '訂單ID', key: 'orderId', width: 40 },
    { header: '更新日期', key: 'updatedAt', width: 20 },
    { header: '價格', key: 'price', width: 15 },
  ];

  worksheet.addRows(
    sortedProductSellCount.map(([name, { quantity, price }]) => {
      return {
        name: name,
        quantity: quantity,
        Price: price,
        ProductPrice: quantity * price,
      };
    }),
  );

  worksheet.addRow({});
  worksheet.addRow({
    name: '總營收',
    ProductPrice: totalRevenue,
  });

  vendorFinishedOrders?.orders.forEach((order) => {
    worksheet2.addRow({
      orderId: order.id,
      updatedAt: order.updatedAt,
      price: order.price,
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `${nameVendor}_${revenueDate}_revenue_report.xlsx`;

  setHeader(
    event,
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`);

  return buffer;
});
