import type { FastifyInstance } from "fastify";
import type { AuthenticatedRequest } from "../auth/dev-auth.js";
import { createAuthPreHandler } from "../auth/dev-auth.js";
import type { Prisma } from "../db.js";

export function registerMeRoutes(app: FastifyInstance, prisma: Prisma) {
  app.get(
    "/me",
    {
      preHandler: createAuthPreHandler(prisma)
    },
    async (request) => {
      const { user } = request as AuthenticatedRequest;

      return {
        user
      };
    }
  );
}
