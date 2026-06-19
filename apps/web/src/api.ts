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

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`
  };
}

export async function fetchCurrentUser(apiUrl: string, token: string) {
  const response = await fetch(`${apiUrl}/me`, {
    headers: authHeaders(token)
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }

  return (await response.json()) as CurrentUserResponse;
}

export async function fetchNotes(apiUrl: string, token: string) {
  const response = await fetch(`${apiUrl}/notes`, {
    headers: authHeaders(token)
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }

  return (await response.json()) as NotesResponse;
}

export async function createNote(
  apiUrl: string,
  token: string,
  input: CreateNoteInput
) {
  const response = await fetch(`${apiUrl}/notes`, {
    body: JSON.stringify(input),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }

  return (await response.json()) as { note: Note };
}

export async function deleteNote(apiUrl: string, token: string, noteId: string) {
  const response = await fetch(`${apiUrl}/notes/${noteId}`, {
    headers: authHeaders(token),
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }
}
