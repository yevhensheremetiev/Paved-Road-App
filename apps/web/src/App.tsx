import { LoadingScreen, SessionErrorScreen, SignInScreen } from "./components/AuthScreens";
import { NotesWorkspace } from "./components/NotesWorkspace";
import { useAuthSession } from "./hooks/useAuthSession";
import "./styles.css";

export function App() {
  const { authSessionQuery, config } = useAuthSession();

  if (authSessionQuery.isPending) {
    return <LoadingScreen label="Loading your session" />;
  }

  if (authSessionQuery.isError) {
    const message =
      authSessionQuery.error instanceof Error
        ? authSessionQuery.error.message
        : "Failed to load the auth session";

    return <SessionErrorScreen message={message} />;
  }

  const auth = authSessionQuery.data;

  if (!auth) {
    return <SessionErrorScreen message="Failed to load the auth session" />;
  }

  if (auth.status === "unauthenticated") {
    return <SignInScreen />;
  }

  return <NotesWorkspace auth={auth} config={config} />;
}
