export type ApiConfig = {
  host: string;
  port: number;
};

export function loadConfig(): ApiConfig {
  return {
    host: process.env.HOST ?? "0.0.0.0",
    port: Number.parseInt(process.env.PORT ?? "3000", 10)
  };
}
