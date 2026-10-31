import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaSingleton = () => {
  return new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
};

export const prisma = globalThis.prisma ?? prismaSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

if (process.env.NODE_ENV === 'development') {
  process.once('SIGUSR2', async () => {
    console.log('Disconnecting Prisma before reload (SIGUSR2)...');
    await prisma.$disconnect();
    process.kill(process.pid, 'SIGUSR2');
  });

  process.once('SIGINT', async () => {
    console.log('Disconnecting Prisma on exit (SIGINT)...');
    await prisma.$disconnect();
    process.exit(0); 
  });
}