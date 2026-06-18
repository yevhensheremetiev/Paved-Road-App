import type { FastifyInstance } from "fastify";
import type { AuthenticatedRequest, TokenVerifier } from "../auth/auth.js";
import { createAuthPreHandler } from "../auth/auth.js";
import type { Prisma } from "../db.js";

export function registerMeRoutes(
  app: FastifyInstance,
  prisma: Prisma,
  tokenVerifier: TokenVerifier
) {
  app.get(
    "/me",
    {
      preHandler: createAuthPreHandler(prisma, tokenVerifier)
    },
    async (request) => {
      const { user } = request as AuthenticatedRequest;

      return {
        user
      };
    }
  );
}
