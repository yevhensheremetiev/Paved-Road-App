import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { createNote, deleteNote, fetchCurrentUser, fetchNotes, type NoteUrgency } from "../api";
import type { AuthSessionState } from "../auth";
import type { WebConfig } from "../config";

export type AuthenticatedSession = Extract<AuthSessionState, { status: "authenticated" }>;

export function useNotesWorkspace(config: WebConfig) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [urgency, setUrgency] = useState<NoteUrgency>("CAN_WAIT");
  const [formError, setFormError] = useState<string | null>(null);

  const currentUserQuery = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => fetchCurrentUser(config.apiUrl)
  });
  const notesQuery = useQuery({
    queryKey: ["notes"],
    queryFn: () => fetchNotes(config.apiUrl)
  });
  const createNoteMutation = useMutation({
    mutationFn: () =>
      createNote(config.apiUrl, {
        content,
        title,
        urgency
      }),
    onSuccess: async () => {
      setTitle("");
      setContent("");
      setUrgency("CAN_WAIT");
      setFormError(null);
      await queryClient.invalidateQueries({
        queryKey: ["notes"]
      });
    }
  });
  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => deleteNote(config.apiUrl, noteId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["notes"]
      });
    }
  });

  function handleCreateNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (title.trim().length === 0) {
      setFormError("Add a note title");
      return;
    }

    setFormError(null);
    createNoteMutation.mutate();
  }

  return {
    createNoteMutation,
    currentUserQuery,
    deleteNoteMutation,
    form: {
      content,
      error: formError,
      handleSubmit: handleCreateNote,
      setContent,
      setTitle,
      setUrgency,
      title,
      urgency
    },
    notesQuery
  };
}
