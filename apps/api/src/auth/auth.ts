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

export type VerifiedTokenClaims = {
  email?: string;
  sub: string;
};

export type TokenVerifier = {
  verify(token: string): Promise<VerifiedTokenClaims>;
};

function parseBearerToken(request: FastifyRequest) {
  const authorization = request.headers.authorization;

  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token || authorization.split(" ").length !== 2) {
    return null;
  }

  return token;
}

export function createAuthPreHandler(prisma: Prisma, tokenVerifier: TokenVerifier) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const token = parseBearerToken(request);

    if (!token) {
      return reply.code(401).send({
        error: "Unauthorized"
      });
    }

    try {
      const claims = await tokenVerifier.verify(token);
      const user = await prisma.user.upsert({
        where: {
          cognitoSub: claims.sub
        },
        update: {
          email: claims.email ?? null
        },
        create: {
          cognitoSub: claims.sub,
          email: claims.email ?? null
        },
        select: {
          id: true,
          cognitoSub: true,
          email: true
        }
      });

      Object.assign(request, {
        user
      });
    } catch {
      return reply.code(401).send({
        error: "Unauthorized"
      });
    }
  };
}
