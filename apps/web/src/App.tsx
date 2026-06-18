import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { fetchCurrentUser } from "./api";
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
  const [state, setState] = useState<LoadState>({
    status: "loading"
  });
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

  if (currentUserQuery.isPending) {
    return (
      <main className="app-shell">
        <p>Loading protected API data...</p>
      </main>
    );
  }

  const currentUser = currentUserQuery.data;

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
    </main>
  );
}
