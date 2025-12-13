import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/client';
import 'dotenv/config';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  await prisma.vendor.updateMany({
    where: { status: 'Pending' },
    data: {
      status: 'PENDING',
    },
  });
}

main()
  .catch(async () => {
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
