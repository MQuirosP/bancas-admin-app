// lib/auth.token.ts
let _accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token || null;
}

export function getAccessToken(): string | null {
  return _accessToken;
}
