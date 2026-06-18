import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const defaultDatabaseUrl =
  "postgresql://paved_road:paved_road@localhost:5432/paved_road_dev?schema=public";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? defaultDatabaseUrl
});

const prisma = new PrismaClient({
  adapter
});

async function main() {
  const user = await prisma.user.upsert({
    where: {
      cognitoSub: "local-demo-user"
    },
    update: {
      email: "demo@example.com"
    },
    create: {
      cognitoSub: "local-demo-user",
      email: "demo@example.com"
    }
  });

  await prisma.note.deleteMany({
    where: {
      userId: user.id
    }
  });

  await prisma.note.createMany({
    data: [
      {
        userId: user.id,
        title: "Welcome to Paved Road",
        content: "This note is seeded for local development."
      },
      {
        userId: user.id,
        title: "Build the paved road",
        content: "Next steps: API auth, web login, and CI/CD gates."
      }
    ]
  });

  console.log(`Seeded demo user ${user.cognitoSub}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
