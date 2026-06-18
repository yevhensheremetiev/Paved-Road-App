import type { FastifyReply, FastifyRequest } from "fastify";
import type { Prisma } from "../db.js";

export type AuthenticatedUser = {
  id: string;
  cognitoSub: string;
  email: string | null;
};

export type AuthenticatedRequest = FastifyRequest & {
  user: AuthenticatedUser;
};

export function createAuthPreHandler(prisma: Prisma) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const demoUserHeader = request.headers["x-demo-user"];
    const cognitoSub = Array.isArray(demoUserHeader) ? demoUserHeader[0] : demoUserHeader;

    if (!cognitoSub) {
      return reply.code(401).send({
        error: "Unauthorized"
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        cognitoSub
      },
      select: {
        id: true,
        cognitoSub: true,
        email: true
      }
    });

    if (!user) {
      return reply.code(401).send({
        error: "Unauthorized"
      });
    }

    Object.assign(request, {
      user
    });
  };
}
