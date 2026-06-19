import { login, logout } from "../auth";

export function LoadingScreen({ label }: { label: string }) {
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

export function SessionErrorScreen({ message }: { message: string }) {
  return (
    <main className="app-shell">
      <h1>Paved Road App</h1>
      <p role="alert">Unable to load the session: {message}</p>
      <button onClick={() => void logout()}>Sign out</button>
    </main>
  );
}

export function SignInScreen() {
  return (
    <main className="app-shell">
      <h1>Paved Road App</h1>
      <p>Sign in to open your notes.</p>
      <button onClick={() => void login()}>Sign in</button>
    </main>
  );
}
