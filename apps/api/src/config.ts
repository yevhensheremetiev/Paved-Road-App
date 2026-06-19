export type ApiConfig = {
  corsOrigin: string;
  auth: {
    cognitoClientId: string;
    cognitoUserPoolId: string;
  };
  host: string;
  port: number;
};

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function loadConfig(): ApiConfig {
  return {
    auth: {
      cognitoClientId: requiredEnv("COGNITO_CLIENT_ID"),
      cognitoUserPoolId: requiredEnv("COGNITO_USER_POOL_ID")
    },
    corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    host: process.env.HOST ?? "0.0.0.0",
    port: Number.parseInt(process.env.PORT ?? "3000", 10)
  };
}
