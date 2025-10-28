import { PrismaClient } from '@prisma/client';

declare global {
  // Evitar múltiples instancias de Prisma en desarrollo
  var prisma: PrismaClient | undefined;
}

// Inicializar PrismaClient
const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// En desarrollo, reutilizar la misma instancia para evitar demasiadas conexiones
if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
}

export { prisma };
