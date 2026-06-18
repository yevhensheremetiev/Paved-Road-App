export type WebConfig = {
  apiUrl: string;
  cognitoClientId: string;
  cognitoDomain: string;
  cognitoUserPoolId: string;
  redirectUrl: string;
};

function requiredEnv(name: string) {
  const value = import.meta.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function normalizeCognitoDomain(domain: string) {
  return domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function loadWebConfig(): WebConfig {
  return {
    apiUrl: requiredEnv("VITE_API_URL"),
    cognitoClientId: requiredEnv("VITE_COGNITO_CLIENT_ID"),
    cognitoDomain: normalizeCognitoDomain(requiredEnv("VITE_COGNITO_DOMAIN")),
    cognitoUserPoolId: requiredEnv("VITE_COGNITO_USER_POOL_ID"),
    redirectUrl: window.location.origin
  };
}
