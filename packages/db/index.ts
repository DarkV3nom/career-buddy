// Imports from the ambient "@prisma/client" package (default generator
// output location -- see prisma/schema.prisma). Every consumer (apps/web
// included) should still import types/enums from "@career-assistant/db"
// rather than "@prisma/client" directly, so this stays the one place that
// couples to Prisma's package.
import { PrismaClient } from "@prisma/client";

// Standard Next.js dev-mode singleton pattern — avoids exhausting the
// Postgres connection pool from hot-reload creating a new PrismaClient
// on every file change.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "@prisma/client";
