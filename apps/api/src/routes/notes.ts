import type { FastifyInstance } from "fastify";
import type { AuthenticatedRequest, TokenVerifier } from "../auth/auth.js";
import { createAuthPreHandler } from "../auth/auth.js";
import type { Prisma } from "../db.js";

type CreateNoteBody = {
  title?: unknown;
  content?: unknown;
  urgency?: unknown;
};

type ValidCreateNoteBody = {
  title: string;
  content: string | null;
  urgency: NoteUrgency;
};

const noteUrgencies = ["URGENT", "CAN_WAIT", "ANYTIME"] as const;

type NoteUrgency = (typeof noteUrgencies)[number];

const publicNoteSelect = {
  content: true,
  id: true,
  title: true,
  urgency: true
} as const;

type CreateNoteValidationResult =
  | {
      ok: true;
      value: ValidCreateNoteBody;
    }
  | {
      ok: false;
      error: string;
    };

function validateCreateNoteBody(body: unknown): CreateNoteValidationResult {
  if (!body || typeof body !== "object") {
    return {
      ok: false,
      error: "Request body must be an object"
    };
  }

  const { title, content, urgency } = body as CreateNoteBody;

  if (typeof title !== "string" || title.trim().length === 0) {
    return {
      ok: false,
      error: "Title is required"
    };
  }

  if (content !== undefined && content !== null && typeof content !== "string") {
    return {
      ok: false,
      error: "Content must be a string"
    };
  }

  if (urgency !== undefined && !noteUrgencies.includes(urgency as NoteUrgency)) {
    return {
      ok: false,
      error: "Urgency must be one of URGENT, CAN_WAIT, or ANYTIME"
    };
  }

  return {
    ok: true,
    value: {
      title: title.trim(),
      content: typeof content === "string" && content.trim().length > 0 ? content.trim() : null,
      urgency: urgency === undefined ? "CAN_WAIT" : (urgency as NoteUrgency)
    }
  };
}

export function registerNotesRoutes(
  app: FastifyInstance,
  prisma: Prisma,
  tokenVerifier: TokenVerifier
) {
  const authPreHandler = createAuthPreHandler(prisma, tokenVerifier);

  app.get(
    "/notes",
    {
      preHandler: authPreHandler
    },
    async (request) => {
      const { user } = request as AuthenticatedRequest;
      const notes = await prisma.note.findMany({
        where: {
          userId: user.id
        },
        orderBy: {
          createdAt: "asc"
        },
        select: publicNoteSelect
      });

      return {
        notes
      };
    }
  );

  app.post(
    "/notes",
    {
      preHandler: authPreHandler
    },
    async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const noteInput = validateCreateNoteBody(request.body);

      if (!noteInput.ok) {
        return reply.code(400).send({
          error: noteInput.error
        });
      }

      const note = await prisma.note.create({
        data: {
          userId: user.id,
          title: noteInput.value.title,
          content: noteInput.value.content,
          urgency: noteInput.value.urgency
        },
        select: publicNoteSelect
      });

      return reply.code(201).send({
        note
      });
    }
  );

  app.delete(
    "/notes/:id",
    {
      preHandler: authPreHandler
    },
    async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      const result = await prisma.note.deleteMany({
        where: {
          id,
          userId: user.id
        }
      });

      if (result.count === 0) {
        return reply.code(404).send({
          error: "Note not found"
        });
      }

      return reply.code(204).send();
    }
  );
}
