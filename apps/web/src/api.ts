export type CurrentUserResponse = {
  user: {
    cognitoSub: string;
    email: string | null;
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

export async function fetchCurrentUser(apiUrl: string, token: string) {
  const response = await fetch(`${apiUrl}/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }

  return (await response.json()) as CurrentUserResponse;
}

export async function fetchNotes(apiUrl: string, token: string) {
  const response = await fetch(`${apiUrl}/notes`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }

  return (await response.json()) as NotesResponse;
}

export async function createNote(apiUrl: string, token: string, input: CreateNoteInput) {
  const response = await fetch(`${apiUrl}/notes`, {
    body: JSON.stringify(input),
    headers: {
      Authorization: `Bearer ${token}`,
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
    headers: {
      Authorization: `Bearer ${token}`
    },
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }
}
