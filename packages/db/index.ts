// Imports from the generated client's own local output path (see
// prisma/schema.prisma's `output` setting) instead of the ambient
// "@prisma/client" package -- works around a known npm-workspaces
// hoisting bug in Prisma's CLI. Every consumer (apps/web included)
// should import types/enums from "@career-assistant/db", not
// "@prisma/client" directly.
import { PrismaClient } from "./generated/client";

// Standard Next.js dev-mode singleton pattern — avoids exhausting the
// Postgres connection pool from hot-reload creating a new PrismaClient
// on every file change.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "./generated/client";
