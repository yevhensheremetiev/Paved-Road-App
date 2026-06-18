import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import type { TokenVerifier, VerifiedTokenClaims } from "../src/auth/auth.js";
import { createPrismaClient, type Prisma } from "../src/db.js";

const demoCognitoSub = "local-demo-user";
const otherCognitoSub = "other-demo-user";
const validDemoToken = "valid-demo-token";
const validOtherToken = "valid-other-token";

let app: FastifyInstance | undefined;
let prisma: Prisma | undefined;
let ownNoteId: string;
let otherNoteId: string;

const tokenClaims = new Map<string, VerifiedTokenClaims>([
  [
    validDemoToken,
    {
      sub: demoCognitoSub,
      email: "demo@example.com"
    }
  ],
  [
    validOtherToken,
    {
      sub: otherCognitoSub,
      email: "other@example.com"
    }
  ]
]);

const fakeTokenVerifier: TokenVerifier = {
  async verify(token) {
    const claims = tokenClaims.get(token);

    if (!claims) {
      throw new Error("Invalid token");
    }

    return claims;
  }
};

async function seedTestData(prismaClient: Prisma) {
  await prismaClient.note.deleteMany();
  await prismaClient.user.deleteMany();

  const demoUser = await prismaClient.user.create({
    data: {
      cognitoSub: demoCognitoSub,
      email: "demo@example.com"
    }
  });

  const otherUser = await prismaClient.user.create({
    data: {
      cognitoSub: otherCognitoSub,
      email: "other@example.com"
    }
  });

  const ownNote = await prismaClient.note.create({
    data: {
      userId: demoUser.id,
      title: "Seeded note",
      content: "Visible to the demo user"
    }
  });

  const otherNote = await prismaClient.note.create({
    data: {
      userId: otherUser.id,
      title: "Other user's note",
      content: "Not visible to the demo user"
    }
  });

  ownNoteId = ownNote.id;
  otherNoteId = otherNote.id;
}

function authHeaders(token = validDemoToken) {
  return {
    authorization: `Bearer ${token}`
  };
}

function getApp() {
  if (!app) {
    throw new Error("Test app was not initialized");
  }

  return app;
}

function getPrisma() {
  if (!prisma) {
    throw new Error("Test Prisma client was not initialized");
  }

  return prisma;
}

beforeEach(async () => {
  prisma = createPrismaClient();
  await seedTestData(prisma);
  app = buildApp({ logger: false, prisma, tokenVerifier: fakeTokenVerifier });
});

afterEach(async () => {
  if (app) {
    await app.close();
    app = undefined;
    prisma = undefined;
    return;
  }

  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined;
  }
});

describe("notes API", () => {
  it("returns health status", async () => {
    const response = await getApp().inject({
      method: "GET",
      url: "/health"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true
    });
  });

  it("rejects requests without authentication", async () => {
    const response = await getApp().inject({
      method: "GET",
      url: "/notes"
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: "Unauthorized"
    });
  });

  it("rejects invalid bearer tokens", async () => {
    const response = await getApp().inject({
      method: "GET",
      url: "/notes",
      headers: authHeaders("invalid-token")
    });

    expect(response.statusCode).toBe(401);
  });

  it("upserts local users from verified token claims", async () => {
    await getPrisma().note.deleteMany();
    await getPrisma().user.deleteMany();

    const response = await getApp().inject({
      method: "GET",
      url: "/me",
      headers: authHeaders()
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      user: {
        cognitoSub: demoCognitoSub,
        email: "demo@example.com"
      }
    });

    await expect(
      getPrisma().user.findUniqueOrThrow({
        where: {
          cognitoSub: demoCognitoSub
        }
      })
    ).resolves.toMatchObject({
      email: "demo@example.com"
    });
  });

  it("returns the current authenticated user", async () => {
    const response = await getApp().inject({
      method: "GET",
      url: "/me",
      headers: authHeaders()
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      user: {
        cognitoSub: demoCognitoSub,
        email: "demo@example.com"
      }
    });
  });

  it("returns only the authenticated user's notes", async () => {
    const response = await getApp().inject({
      method: "GET",
      url: "/notes",
      headers: authHeaders()
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.notes).toHaveLength(1);
    expect(body.notes[0]).toMatchObject({
      id: ownNoteId,
      title: "Seeded note"
    });
  });

  it("creates a note for the authenticated user", async () => {
    const response = await getApp().inject({
      method: "POST",
      url: "/notes",
      headers: authHeaders(),
      payload: {
        title: "New API note",
        content: "Created through Fastify injection"
      }
    });

    const body = response.json();

    expect(response.statusCode).toBe(201);
    expect(body.note).toMatchObject({
      title: "New API note",
      content: "Created through Fastify injection"
    });

    const createdNote = await getPrisma().note.findUniqueOrThrow({
      where: {
        id: body.note.id
      }
    });

    expect(createdNote.title).toBe("New API note");
  });

  it("rejects invalid note input", async () => {
    const response = await getApp().inject({
      method: "POST",
      url: "/notes",
      headers: authHeaders(),
      payload: {
        content: "Missing title"
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: "Title is required"
    });
  });

  it("deletes only the authenticated user's note", async () => {
    const otherDeleteResponse = await getApp().inject({
      method: "DELETE",
      url: `/notes/${otherNoteId}`,
      headers: authHeaders()
    });

    expect(otherDeleteResponse.statusCode).toBe(404);
    await expect(
      getPrisma().note.findUniqueOrThrow({
        where: {
          id: otherNoteId
        }
      })
    ).resolves.toMatchObject({
      id: otherNoteId
    });

    const ownDeleteResponse = await getApp().inject({
      method: "DELETE",
      url: `/notes/${ownNoteId}`,
      headers: authHeaders()
    });

    expect(ownDeleteResponse.statusCode).toBe(204);
    await expect(
      getPrisma().note.findUnique({
        where: {
          id: ownNoteId
        }
      })
    ).resolves.toBeNull();
  });
});
