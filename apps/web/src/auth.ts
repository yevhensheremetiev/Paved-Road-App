import { Amplify } from "aws-amplify";
import "aws-amplify/auth/enable-oauth-listener";
import { fetchAuthSession, getCurrentUser, signInWithRedirect, signOut } from "aws-amplify/auth";
import type { WebConfig } from "./config";

export type AuthSessionState =
  | {
      email: string | null;
      status: "authenticated";
      token: string;
      username: string;
    }
  | {
      status: "unauthenticated";
    };

const e2eAuthEnabled = import.meta.env.VITE_E2E_AUTH === "true";
const e2eAuthStateKey = "paved-road-e2e-auth-state";
let unauthorizedRedirectStarted = false;

export function configureAuth(config: WebConfig) {
  if (e2eAuthEnabled) {
    return;
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: config.cognitoUserPoolId,
        userPoolClientId: config.cognitoClientId,
        loginWith: {
          oauth: {
            domain: config.cognitoDomain,
            scopes: ["openid", "email", "profile"],
            redirectSignIn: [config.redirectUrl],
            redirectSignOut: [config.redirectUrl],
            responseType: "code"
          }
        }
      }
    }
  });
}

export async function getAuthSession(): Promise<AuthSessionState> {
  if (e2eAuthEnabled) {
    if (window.localStorage.getItem(e2eAuthStateKey) === "unauthenticated") {
      return {
        status: "unauthenticated"
      };
    }

    return {
      email: import.meta.env.VITE_E2E_EMAIL || "e2e@example.com",
      status: "authenticated",
      token: import.meta.env.VITE_E2E_AUTH_TOKEN || "e2e-token",
      username: import.meta.env.VITE_E2E_USERNAME || "E2E User"
    };
  }

  try {
    const [currentUser, session] = await Promise.all([getCurrentUser(), fetchAuthSession()]);
    const token = session.tokens?.accessToken?.toString();
    const idToken = session.tokens?.idToken;

    if (!token || !idToken) {
      return {
        status: "unauthenticated"
      };
    }

    const emailClaim = idToken.payload.email;

    return {
      email: typeof emailClaim === "string" ? emailClaim : null,
      status: "authenticated",
      token,
      username: currentUser.username
    };
  } catch {
    return {
      status: "unauthenticated"
    };
  }
}

export async function getAccessToken() {
  if (e2eAuthEnabled) {
    return import.meta.env.VITE_E2E_AUTH_TOKEN || "e2e-token";
  }

  const session = await fetchAuthSession();
  const token = session.tokens?.accessToken?.toString();

  if (!token) {
    throw new Error("No access token available");
  }

  return token;
}

export async function redirectToLoginAfterUnauthorized() {
  if (unauthorizedRedirectStarted) {
    return;
  }

  unauthorizedRedirectStarted = true;

  if (e2eAuthEnabled) {
    window.localStorage.setItem(e2eAuthStateKey, "unauthenticated");
    window.location.reload();
    return;
  }

  try {
    await signOut();
  } finally {
    await signInWithRedirect();
  }
}

export async function login() {
  if (e2eAuthEnabled) {
    window.localStorage.setItem(e2eAuthStateKey, "authenticated");
    window.location.reload();
    return;
  }

  await signInWithRedirect();
}

export async function logout() {
  if (e2eAuthEnabled) {
    window.localStorage.setItem(e2eAuthStateKey, "unauthenticated");
    window.location.reload();
    return;
  }

  await signOut();
}
