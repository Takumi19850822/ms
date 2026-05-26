function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function getAppUrl(): string {
  const configured = process.env.APP_URL?.trim();
  if (configured) {
    return trimTrailingSlash(configured);
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return trimTrailingSlash(`https://${vercelUrl}`);
  }

  return "http://localhost:3000";
}
