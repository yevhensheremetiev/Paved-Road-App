import cors from "@fastify/cors";
import Fastify from "fastify";
import type { TokenVerifier } from "./auth/auth.js";
import type { Prisma } from "./db.js";
import { registerMeRoutes } from "./routes/me.js";
import { registerNotesRoutes } from "./routes/notes.js";

export type AppOptions = {
  corsOrigin?: string;
  logger?: boolean;
  prisma: Prisma;
  tokenVerifier: TokenVerifier;
};

export function buildApp({ corsOrigin, logger = true, prisma, tokenVerifier }: AppOptions) {
  const app = Fastify({
    logger
  });

  if (corsOrigin) {
    void app.register(cors, {
      origin: corsOrigin
    });
  }

  app.get("/health", async () => ({
    ok: true
  }));

  registerMeRoutes(app, prisma, tokenVerifier);
  registerNotesRoutes(app, prisma, tokenVerifier);

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });

  return app;
}
