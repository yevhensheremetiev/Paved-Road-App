import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createNote, deleteNote, fetchCurrentUser, fetchNotes } from "./api";
import { configureAuth, getAuthSession, login, logout, type AuthSessionState } from "./auth";
import { loadWebConfig } from "./config";
import "./styles.css";

type LoadState =
  | {
      status: "loading";
    }
  | {
      status: "ready";
      auth: AuthSessionState;
    }
  | {
      message: string;
      status: "error";
    };

function getInitials(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => (part[0] ?? "").toUpperCase())
    .join("");

  return initials || "U";
}

function formatNoteCount(count: number) {
  const label = count === 1 ? "note" : "notes";

  return `${count} ${label}`;
}

function LoadingScreen({ label }: { label: string }) {
  return (
    <main className="app-shell loading-screen" aria-busy="true" aria-live="polite">
      <div className="loader" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <span className="sr-only">{label}</span>
    </main>
  );
}

export function App() {
  const config = useMemo(() => loadWebConfig(), []);
  const queryClient = useQueryClient();
  const [state, setState] = useState<LoadState>({
    status: "loading"
  });
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const auth = state.status === "ready" ? state.auth : null;
  const currentUserQuery = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => {
      if (auth?.status !== "authenticated") {
        throw new Error("Cannot load current user without an authenticated session");
      }

      return fetchCurrentUser(config.apiUrl, auth.token);
    },
    enabled: auth?.status === "authenticated"
  });
  const notesQuery = useQuery({
    queryKey: ["notes"],
    queryFn: () => {
      if (auth?.status !== "authenticated") {
        throw new Error("Cannot load notes without an authenticated session");
      }

      return fetchNotes(config.apiUrl, auth.token);
    },
    enabled: auth?.status === "authenticated"
  });
  const createNoteMutation = useMutation({
    mutationFn: () => {
      if (auth?.status !== "authenticated") {
        throw new Error("Cannot create notes without an authenticated session");
      }

      return createNote(config.apiUrl, auth.token, {
        title,
        content
      });
    },
    onSuccess: async () => {
      setTitle("");
      setContent("");
      setFormError(null);
      await queryClient.invalidateQueries({
        queryKey: ["notes"]
      });
    }
  });
  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => {
      if (auth?.status !== "authenticated") {
        throw new Error("Cannot delete notes without an authenticated session");
      }

      return deleteNote(config.apiUrl, auth.token, noteId);
    },
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

  useEffect(() => {
    configureAuth(config);

    async function loadSession() {
      const auth = await getAuthSession();

      if (auth.status === "unauthenticated") {
        setState({
          status: "ready",
          auth
        });
        return;
      }

      setState({
        status: "ready",
        auth
      });
    }

    void loadSession();
  }, [config]);

  if (state.status === "loading") {
    return <LoadingScreen label="Loading your session" />;
  }

  if (state.status === "error" || currentUserQuery.isError) {
    const message =
      state.status === "error"
        ? state.message
        : currentUserQuery.error instanceof Error
          ? currentUserQuery.error.message
          : "Failed to load current user";

    return (
      <main className="app-shell">
        <h1>Paved Road App</h1>
        <p role="alert">Unable to load the session: {message}</p>
        <button onClick={() => void logout()}>Sign out</button>
      </main>
    );
  }

  if (state.auth.status === "unauthenticated") {
    return (
      <main className="app-shell">
        <h1>Paved Road App</h1>
        <p>Sign in to open your notes.</p>
        <button onClick={() => void login()}>Sign in</button>
      </main>
    );
  }

  if (currentUserQuery.isPending || notesQuery.isPending) {
    return <LoadingScreen label="Loading your workspace" />;
  }

  const currentUser = currentUserQuery.data;
  const notes = notesQuery.data?.notes ?? [];
  const email = currentUser.user.email;
  const username = state.auth.username;
  const initials = getInitials(username);

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <span className="eyebrow">Personal workspace</span>
          <h1>My Notes</h1>
          <p>Keep ideas, tasks, and quick reminders in one clean place.</p>
        </div>
        <button className="secondary-button" onClick={() => void logout()}>
          Sign out
        </button>
      </header>

      <section className="card profile-card" aria-label="User profile">
        <div className="profile-avatar" aria-hidden="true">
          {initials}
        </div>
        <div className="profile-details">
          <span className="eyebrow">Your profile</span>
          <h2>{username}</h2>
          <p>{email ?? "Email not provided"}</p>
        </div>
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <span className="eyebrow">Collection</span>
            <h2>Notes</h2>
            <p>Create short notes and quickly remove anything you no longer need.</p>
          </div>
          <span className="pill">{formatNoteCount(notes.length)}</span>
        </div>

        <form className="note-form" onSubmit={handleCreateNote}>
          <label>
            Title
            <input
              onChange={(event) => setTitle(event.target.value)}
              placeholder="For example, daily plan"
              value={title}
            />
          </label>
          <label>
            Content
            <textarea
              onChange={(event) => setContent(event.target.value)}
              placeholder="Write an idea, task, or reminder..."
              rows={4}
              value={content}
            />
          </label>

          {formError ? <p className="error-message">{formError}</p> : null}
          {createNoteMutation.isError ? (
            <p className="error-message" role="alert">
              Failed to create note. Please try again.
            </p>
          ) : null}

          <button disabled={createNoteMutation.isPending} type="submit">
            {createNoteMutation.isPending ? "Creating..." : "Add note"}
          </button>
        </form>

        {notesQuery.isError ? (
          <p className="error-message" role="alert">
            Failed to load notes. Refresh the page and try again.
          </p>
        ) : notes.length === 0 ? (
          <div className="empty-state">
            <h3>Nothing here yet</h3>
            <p>Add your first note above, and it will appear in this collection.</p>
          </div>
        ) : (
          <ul className="note-list">
            {notes.map((note) => (
              <li className="note-item" key={note.id}>
                <div className="note-content">
                  <h3>{note.title}</h3>
                  <p>{note.content ?? "No additional content."}</p>
                </div>
                <button
                  className="secondary-button"
                  disabled={deleteNoteMutation.isPending}
                  onClick={() => deleteNoteMutation.mutate(note.id)}
                  type="button"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}

        {deleteNoteMutation.isError ? (
          <p className="error-message" role="alert">
            Failed to delete note. Please try again.
          </p>
        ) : null}
      </section>
    </main>
  );
}
