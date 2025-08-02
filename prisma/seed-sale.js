import { prisma } from '../src/common/utils/prisma.js';
import { saleData } from './data/sale.js';

async function main() {
  // sale만 시딩
  await prisma.sale.createMany({ data: saleData });
}

main()
  .catch((e) => {
    console.error('시딩 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
