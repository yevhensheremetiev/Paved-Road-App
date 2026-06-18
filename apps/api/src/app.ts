import Fastify from "fastify";
import type { Prisma } from "./db.js";
import { registerMeRoutes } from "./routes/me.js";
import { registerNotesRoutes } from "./routes/notes.js";

export type AppOptions = {
  logger?: boolean;
  prisma: Prisma;
};

export function buildApp({ logger = true, prisma }: AppOptions) {
  const app = Fastify({
    logger
  });

  app.get("/health", async () => ({
    ok: true
  }));

  registerMeRoutes(app, prisma);
  registerNotesRoutes(app, prisma);

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });

  return app;
}
