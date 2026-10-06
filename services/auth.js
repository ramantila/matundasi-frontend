"use client";
import axios from 'axios';
import { getSession, saveSession, clearSession, sessionFromLogin } from '@/lib/session';

// Plain axios (not ./interceptor) so these calls never trigger the refresh-on-401 logic themselves.
const authApi = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || '' });

let inFlight = null;

// Swaps the refresh token for a new token pair and stores it. Refresh tokens are
// single-use, so concurrent callers share one request. Resolves to the new
// session, or null when the refresh token is missing, expired or rejected.
export function refreshSession() {
    if (inFlight) return inFlight;
    const refreshToken = getSession()?.refreshToken;
    if (!refreshToken) return Promise.resolve(null);
    inFlight = authApi.post('/api/v1/auth/refresh', { refreshToken })
        .then(({ data: res }) => {
            const session = sessionFromLogin(res?.data ?? res);
            saveSession(session);
            return session;
        })
        // Rejected (used, revoked, expired, account disabled) → signed out. A network error keeps
        // the session so the next request can try again.
        .catch((err) => { if (err.response) clearSession(); return null; })
        .finally(() => { inFlight = null; });
    return inFlight;
}

// Revokes the refresh token on the server (best effort) and forgets the session.
export async function logout() {
    const refreshToken = getSession()?.refreshToken;
    clearSession();
    if (refreshToken) {
        try { await authApi.post('/api/v1/auth/logout', { refreshToken }); } catch { /* signed out locally either way */ }
    }
}
