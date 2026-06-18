import { Amplify } from "aws-amplify";
import "aws-amplify/auth/enable-oauth-listener";
import { fetchAuthSession, getCurrentUser, signInWithRedirect, signOut } from "aws-amplify/auth";
import type { WebConfig } from "./config";

export type AuthSessionState =
  | {
      status: "authenticated";
      token: string;
      username: string;
    }
  | {
      status: "unauthenticated";
    };

export function configureAuth(config: WebConfig) {
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
  try {
    const [currentUser, session] = await Promise.all([getCurrentUser(), fetchAuthSession()]);
    const token = session.tokens?.idToken?.toString() ?? session.tokens?.accessToken?.toString();

    if (!token) {
      return {
        status: "unauthenticated"
      };
    }

    return {
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

export async function login() {
  await signInWithRedirect();
}

export async function logout() {
  await signOut();
}
