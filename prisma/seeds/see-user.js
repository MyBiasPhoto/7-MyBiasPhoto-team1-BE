import { prisma } from '../../src/common/utils/prisma.js';
import { userData } from '../data/user.js';
import bcrypt from 'bcryptjs';

export default async function seedUser() {
  const saltRounds = 10;
  const userIdMap = new Map();

  for (let i = 0; i < userData.length; i++) {
    const hashedPassword = await bcrypt.hash(userData[i].password, saltRounds);
    const created = await prisma.user.create({
      data: { ...userData[i], password: hashedPassword },
    });
    userIdMap.set(i + 1, created.id);
  }

  return userIdMap;
}
