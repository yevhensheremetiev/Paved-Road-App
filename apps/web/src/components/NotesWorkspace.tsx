import type { Note } from "../api";
import { logout } from "../auth";
import type { WebConfig } from "../config";
import { type AuthenticatedSession, useNotesWorkspace } from "../hooks/useNotesWorkspace";
import { LoadingScreen, SessionErrorScreen } from "./AuthScreens";

type NotesWorkspaceProps = {
  auth: AuthenticatedSession;
  config: WebConfig;
};

type NotesWorkspaceState = ReturnType<typeof useNotesWorkspace>;

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

const urgencyOptions = [
  { label: "Urgent", value: "URGENT" },
  { label: "Can wait", value: "CAN_WAIT" },
  { label: "Anytime", value: "ANYTIME" }
] as const satisfies readonly { label: string; value: Note["urgency"] }[];

const urgencyBadges = {
  ANYTIME: {
    className: "note-urgency note-urgency-anytime",
    label: "Anytime"
  },
  CAN_WAIT: {
    className: "note-urgency note-urgency-can-wait",
    label: "Can wait"
  },
  URGENT: {
    className: "note-urgency note-urgency-urgent",
    label: "Urgent"
  }
} as const satisfies Record<Note["urgency"], { className: string; label: string }>;

function WorkspaceHeader() {
  return (
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
  );
}

function ProfileCard({ email, username }: { email: string | null; username: string }) {
  return (
    <section className="card profile-card" aria-label="User profile">
      <div className="profile-avatar" aria-hidden="true">
        {getInitials(username)}
      </div>
      <div className="profile-details">
        <span className="eyebrow">Your profile</span>
        <h2>{username}</h2>
        <p>{email ?? "Email not provided"}</p>
      </div>
    </section>
  );
}

type NoteFormProps = {
  createNoteMutation: NotesWorkspaceState["createNoteMutation"];
  form: NotesWorkspaceState["form"];
};

function NoteForm({ createNoteMutation, form }: NoteFormProps) {
  return (
    <form className="note-form" onSubmit={form.handleSubmit}>
      <label>
        Title
        <input
          onChange={(event) => form.setTitle(event.target.value)}
          placeholder="For example, daily plan"
          value={form.title}
        />
      </label>
      <label>
        Content
        <textarea
          onChange={(event) => form.setContent(event.target.value)}
          placeholder="Write an idea, task, or reminder..."
          rows={4}
          value={form.content}
        />
      </label>
      <label>
        Urgency
        <select
          onChange={(event) => form.setUrgency(event.target.value as Note["urgency"])}
          value={form.urgency}
        >
          {urgencyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {form.error ? <p className="error-message">{form.error}</p> : null}
      {createNoteMutation.isError ? (
        <p className="error-message" role="alert">
          Failed to create note. Please try again.
        </p>
      ) : null}

      <button disabled={createNoteMutation.isPending} type="submit">
        {createNoteMutation.isPending ? "Creating..." : "Add note"}
      </button>
    </form>
  );
}

function NotesList({
  deleteNoteMutation,
  notes
}: {
  deleteNoteMutation: NotesWorkspaceState["deleteNoteMutation"];
  notes: Note[];
}) {
  if (notes.length === 0) {
    return (
      <div className="empty-state">
        <h3>Nothing here yet</h3>
        <p>Add your first note above, and it will appear in this collection.</p>
      </div>
    );
  }

  return (
    <ul className="note-list">
      {notes.map((note) => {
        const noteContent = note.content ?? "No additional content.";

        return (
          <li className="note-item" key={note.id}>
            <div className="note-content">
              <div className="note-title-row">
                <h3 title={note.title}>{note.title}</h3>
                <span className={urgencyBadges[note.urgency].className}>
                  {urgencyBadges[note.urgency].label}
                </span>
              </div>
              <p title={noteContent}>{noteContent}</p>
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
        );
      })}
    </ul>
  );
}

type NotesCardProps = {
  workspace: NotesWorkspaceState;
};

function NotesCard({ workspace }: NotesCardProps) {
  const { createNoteMutation, deleteNoteMutation, form, notesQuery } = workspace;
  const notes = notesQuery.data?.notes ?? [];

  return (
    <section className="card">
      <div className="section-header">
        <div>
          <span className="eyebrow">Collection</span>
          <h2>Notes</h2>
          <p>Create short notes and quickly remove anything you no longer need.</p>
        </div>
        <span className="pill">{formatNoteCount(notes.length)}</span>
      </div>

      <NoteForm createNoteMutation={createNoteMutation} form={form} />

      {notesQuery.isError ? (
        <p className="error-message" role="alert">
          Failed to load notes. Refresh the page and try again.
        </p>
      ) : (
        <NotesList deleteNoteMutation={deleteNoteMutation} notes={notes} />
      )}

      {deleteNoteMutation.isError ? (
        <p className="error-message" role="alert">
          Failed to delete note. Please try again.
        </p>
      ) : null}
    </section>
  );
}

export function NotesWorkspace({ auth, config }: NotesWorkspaceProps) {
  const workspace = useNotesWorkspace(config);
  const { currentUserQuery, notesQuery } = workspace;

  if (currentUserQuery.isError) {
    const message =
      currentUserQuery.error instanceof Error
        ? currentUserQuery.error.message
        : "Failed to load current user";

    return <SessionErrorScreen message={message} />;
  }

  if (currentUserQuery.isPending || notesQuery.isPending) {
    return <LoadingScreen label="Loading your workspace" />;
  }

  if (!currentUserQuery.data) {
    return <SessionErrorScreen message="Failed to load current user" />;
  }

  return (
    <main className="app-shell">
      <WorkspaceHeader />
      <ProfileCard email={auth.email} username={auth.username} />
      <NotesCard workspace={workspace} />
    </main>
  );
}
