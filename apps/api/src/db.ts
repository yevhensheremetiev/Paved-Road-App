import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const defaultDatabaseUrl =
  "postgresql://paved_road:paved_road@localhost:5432/paved_road_dev?schema=public";

export function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL ?? defaultDatabaseUrl
  });

  return new PrismaClient({
    adapter
  });
}

export type Prisma = ReturnType<typeof createPrismaClient>;
