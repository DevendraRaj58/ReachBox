import { prisma } from '../db/prisma.js';

const user = await prisma.user.upsert({
  where: {
    googleId: 'dev-google-user',
  },
  update: {},
  create: {
    googleId: 'dev-google-user',
    name: 'Development User',
    email: 'dev@reachinbox.local',
    avatarUrl: null,
  },
});

console.log('Development user:', user);

await prisma.$disconnect();