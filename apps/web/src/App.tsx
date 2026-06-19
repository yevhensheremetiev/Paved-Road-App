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
      setFormError("Title is required");
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
    return (
      <main className="app-shell">
        <p>Loading authentication state...</p>
      </main>
    );
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
        <p role="alert">Unable to load the authenticated API session: {message}</p>
        <button onClick={() => void logout()}>Sign out</button>
      </main>
    );
  }

  if (state.auth.status === "unauthenticated") {
    return (
      <main className="app-shell">
        <h1>Paved Road App</h1>
        <p>Sign in with Cognito to access the protected API.</p>
        <button onClick={() => void login()}>Sign in</button>
      </main>
    );
  }

  if (currentUserQuery.isPending || notesQuery.isPending) {
    return (
      <main className="app-shell">
        <p>Loading protected API data...</p>
      </main>
    );
  }

  const currentUser = currentUserQuery.data;
  const notes = notesQuery.data?.notes ?? [];

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>Paved Road App</h1>
          <p>Authenticated through Cognito and verified by the API.</p>
        </div>
        <button onClick={() => void logout()}>Sign out</button>
      </header>

      <section className="card">
        <h2>Current User</h2>
        <dl>
          <dt>Frontend username</dt>
          <dd>{state.auth.username}</dd>
          <dt>API user id</dt>
          <dd>{currentUser.user.id}</dd>
          <dt>Cognito subject</dt>
          <dd>{currentUser.user.cognitoSub}</dd>
          <dt>Email</dt>
          <dd>{currentUser.user.email ?? "Not provided"}</dd>
        </dl>
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <h2>Notes</h2>
            <p>Create and manage notes owned by the authenticated API user.</p>
          </div>
          <span className="pill">{notes.length} total</span>
        </div>

        <form className="note-form" onSubmit={handleCreateNote}>
          <label>
            Title
            <input
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Release checklist"
              value={title}
            />
          </label>
          <label>
            Content
            <textarea
              onChange={(event) => setContent(event.target.value)}
              placeholder="Write the next step..."
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
            {createNoteMutation.isPending ? "Creating..." : "Create note"}
          </button>
        </form>

        {notesQuery.isError ? (
          <p className="error-message" role="alert">
            Failed to load notes. Please refresh and try again.
          </p>
        ) : notes.length === 0 ? (
          <p className="empty-state">No notes yet. Create the first one above.</p>
        ) : (
          <ul className="note-list">
            {notes.map((note) => (
              <li className="note-item" key={note.id}>
                <div>
                  <h3>{note.title}</h3>
                  <p>{note.content ?? "No content provided."}</p>
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
