import seedUser from './seeds/see-user.js';
import seedPhotoCard from './seeds/seed-photoCard.js';
import seedUserCard from './seeds/seed-userCard.js';
import seedSale from './seeds/seed-sale.js';

async function main() {
  const userIdMap = await seedUser();
  const photoCardIdMap = await seedPhotoCard(userIdMap);
  const userCardIdMap = await seedUserCard(userIdMap, photoCardIdMap);
  await seedSale(userIdMap, photoCardIdMap, userCardIdMap);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import('../src/common/utils/prisma.js');
    await prisma.$disconnect();
  });
