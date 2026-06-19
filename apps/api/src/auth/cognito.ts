import { CognitoJwtVerifier } from "aws-jwt-verify";
import type { TokenVerifier, VerifiedAccessTokenClaims } from "./auth.js";

export type CognitoAuthConfig = {
  cognitoClientId: string;
  cognitoUserPoolId: string;
};

export function createCognitoTokenVerifier({
  cognitoClientId,
  cognitoUserPoolId
}: CognitoAuthConfig): TokenVerifier {
  const accessTokenVerifier = CognitoJwtVerifier.create({
    clientId: cognitoClientId,
    tokenUse: "access",
    userPoolId: cognitoUserPoolId
  });

  return {
    async verifyAccessToken(token: string): Promise<VerifiedAccessTokenClaims> {
      const payload = await accessTokenVerifier.verify(token);

      return {
        sub: payload.sub
      };
    }
  };
}
