const BEARER_PREFIX = "Bearer ";
export const SESSION_COOKIE_NAME = "trading_dashboard_session";

const parseCookieHeader = (cookieHeader: string | undefined): Map<string, string> => {
  const cookies = new Map<string, string>();
  if (!cookieHeader) {
    return cookies;
  }

  cookieHeader.split(";").forEach((segment) => {
    const separatorIndex = segment.indexOf("=");
    if (separatorIndex <= 0) {
      return;
    }

    const key = segment.slice(0, separatorIndex).trim();
    const value = segment.slice(separatorIndex + 1).trim();
    if (!key || !value) {
      return;
    }

    cookies.set(key, decodeURIComponent(value));
  });

  return cookies;
};

export const getBearerToken = (authorizationHeader: string | undefined): string | null => {
  if (!authorizationHeader || !authorizationHeader.startsWith(BEARER_PREFIX)) {
    return null;
  }

  const token = authorizationHeader.slice(BEARER_PREFIX.length).trim();
  return token.length > 0 ? token : null;
};

export const getSessionTokenFromCookie = (cookieHeader: string | undefined): string | null => {
  const token = parseCookieHeader(cookieHeader).get(SESSION_COOKIE_NAME);
  return token && token.trim().length > 0 ? token.trim() : null;
};

export const getSessionTokenFromRequest = (request: {
  headers?: { authorization?: string | undefined; cookie?: string | undefined };
}): string | null =>
  getSessionTokenFromCookie(request.headers?.cookie) ??
  getBearerToken(request.headers?.authorization);

export const getTokenFromRequestUrl = (requestUrl: string | undefined): string | null => {
  if (!requestUrl) {
    return null;
  }

  const url = new URL(requestUrl, "http://localhost");
  const token = url.searchParams.get("token");
  return token && token.trim().length > 0 ? token.trim() : null;
};

export const getSessionTokenFromUpgradeRequest = (request: {
  headers: { cookie?: string | undefined };
  url?: string | undefined;
}): string | null =>
  getSessionTokenFromCookie(request.headers.cookie) ?? getTokenFromRequestUrl(request.url);

export const createSessionCookie = (token: string, ttlMs: number): string => {
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.max(1, Math.floor(ttlMs / 1000))}`
  ];

  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }

  return parts.join("; ");
};

export const clearSessionCookie = (): string => {
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0"
  ];

  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }

  return parts.join("; ");
};
