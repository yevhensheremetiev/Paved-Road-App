import { getAccessToken, redirectToLoginAfterUnauthorized } from "./auth";

export type CurrentUserResponse = {
  user: {
    cognitoSub: string;
    id: string;
  };
};

export type Note = {
  content: string | null;
  id: string;
  title: string;
  urgency: NoteUrgency;
};

export type NoteUrgency = "URGENT" | "CAN_WAIT" | "ANYTIME";

export type NotesResponse = {
  notes: Note[];
};

export type CreateNoteInput = {
  content: string;
  title: string;
  urgency: NoteUrgency;
};

async function authHeaders() {
  const token = await getAccessToken();

  return {
    Authorization: `Bearer ${token}`
  };
}

async function ensureOkResponse(response: Response) {
  if (response.ok) {
    return;
  }

  if (response.status === 401) {
    await redirectToLoginAfterUnauthorized();
  }

  throw new Error(`API returned ${response.status}`);
}

export async function fetchCurrentUser(apiUrl: string) {
  const response = await fetch(`${apiUrl}/me`, {
    headers: await authHeaders()
  });

  await ensureOkResponse(response);

  return (await response.json()) as CurrentUserResponse;
}

export async function fetchNotes(apiUrl: string) {
  const response = await fetch(`${apiUrl}/notes`, {
    headers: await authHeaders()
  });

  await ensureOkResponse(response);

  return (await response.json()) as NotesResponse;
}

export async function createNote(apiUrl: string, input: CreateNoteInput) {
  const response = await fetch(`${apiUrl}/notes`, {
    body: JSON.stringify(input),
    headers: {
      ...(await authHeaders()),
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  await ensureOkResponse(response);

  return (await response.json()) as { note: Note };
}

export async function deleteNote(apiUrl: string, noteId: string) {
  const response = await fetch(`${apiUrl}/notes/${noteId}`, {
    headers: await authHeaders(),
    method: "DELETE"
  });

  await ensureOkResponse(response);
}
