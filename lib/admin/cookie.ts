export function isProdEnv() {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}