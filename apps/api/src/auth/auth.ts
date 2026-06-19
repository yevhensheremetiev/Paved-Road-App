import type { FastifyReply, FastifyRequest } from "fastify";
import type { Prisma } from "../db.js";

export type AuthenticatedUser = {
  id: string;
  cognitoSub: string;
};

export type AuthenticatedRequest = FastifyRequest & {
  user: AuthenticatedUser;
};

export type VerifiedAccessTokenClaims = {
  sub: string;
};

export type TokenVerifier = {
  verifyAccessToken(token: string): Promise<VerifiedAccessTokenClaims>;
};

const authenticatedUserSelect = {
  cognitoSub: true,
  id: true
} as const;

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

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

async function findOrCreateAuthenticatedUser(prisma: Prisma, cognitoSub: string) {
  const existingUser = await prisma.user.findUnique({
    where: {
      cognitoSub
    },
    select: authenticatedUserSelect
  });

  if (existingUser) {
    return existingUser;
  }

  try {
    return await prisma.user.create({
      data: {
        cognitoSub
      },
      select: authenticatedUserSelect
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    return prisma.user.findUniqueOrThrow({
      where: {
        cognitoSub
      },
      select: authenticatedUserSelect
    });
  }
}

export function createAuthPreHandler(prisma: Prisma, tokenVerifier: TokenVerifier) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const accessToken = parseBearerToken(request);

    if (!accessToken) {
      return reply.code(401).send({
        error: "Unauthorized"
      });
    }

    let accessClaims: VerifiedAccessTokenClaims;

    try {
      accessClaims = await tokenVerifier.verifyAccessToken(accessToken);
    } catch {
      return reply.code(401).send({
        error: "Unauthorized"
      });
    }

    try {
      const user = await findOrCreateAuthenticatedUser(prisma, accessClaims.sub);

      Object.assign(request, {
        user
      });
    } catch (error) {
      request.log.error(
        {
          err: error
        },
        "Failed to sync authenticated user"
      );

      return reply.code(500).send({
        error: "Failed to authenticate user"
      });
    }
  };
}
