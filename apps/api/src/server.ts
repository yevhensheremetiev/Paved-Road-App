import { buildApp } from "./app.js";
import { createCognitoTokenVerifier } from "./auth/cognito.js";
import { loadConfig } from "./config.js";
import { createPrismaClient } from "./db.js";

const config = loadConfig();
const prisma = createPrismaClient();
const tokenVerifier = createCognitoTokenVerifier(config.auth);
const app = buildApp({
  corsOrigin: config.corsOrigin,
  prisma,
  tokenVerifier
});

try {
  await app.listen({
    host: config.host,
    port: config.port
  });
} catch (error) {
  app.log.error(error);

  try {
    await app.close();
  } catch (closeError) {
    app.log.error(closeError);
  }

  process.exitCode = 1;
}
