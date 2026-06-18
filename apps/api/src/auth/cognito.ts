import { CognitoJwtVerifier } from "aws-jwt-verify";
import type { TokenVerifier, VerifiedTokenClaims } from "./auth.js";

export type CognitoAuthConfig = {
  cognitoClientId: string;
  cognitoUserPoolId: string;
};

export function createCognitoTokenVerifier({
  cognitoClientId,
  cognitoUserPoolId
}: CognitoAuthConfig): TokenVerifier {
  const verifier = CognitoJwtVerifier.create({
    clientId: cognitoClientId,
    tokenUse: null,
    userPoolId: cognitoUserPoolId
  });

  return {
    async verify(token: string): Promise<VerifiedTokenClaims> {
      const payload = await verifier.verify(token);
      const emailClaim = payload.email;

      return {
        sub: payload.sub,
        email: typeof emailClaim === "string" ? emailClaim : undefined
      };
    }
  };
}
