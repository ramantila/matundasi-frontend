export const SESSION_KEY  = 'matundasiSession';
export const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true';

// The stored login, or null when there is none or it can no longer be renewed.
// The access token inside may already be expired — services/auth.js refreshes it.
export function getSession() {
    if (typeof window === 'undefined') return null;
    let session;
    try {
        session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    } catch {
        return null;
    }
    if (session && sessionMsLeft(session) <= 0) {
        clearSession();
        return null;
    }
    return session;
}

const msUntil = (iso) => {
    const at = iso ? Date.parse(iso) : NaN;
    return Number.isNaN(at) ? Infinity : at - Date.now();
};

// Milliseconds until the session ends: when the refresh token expires, or the access
// token if there is no refresh token (Infinity if the backend sent no expiry).
export function sessionMsLeft(session) {
    return msUntil(session?.refreshToken ? session.refreshExpiresAt : session?.expiresAt);
}

// Milliseconds until the access token expires.
export const accessMsLeft = (session) => msUntil(session?.expiresAt);

// Builds the stored session from the /auth/login response (LoginResponse).
export function sessionFromLogin(data) {
    return {
        accessToken:      data.token,
        expiresAt:        data.expiresAt,
        refreshToken:     data.refreshToken,
        refreshExpiresAt: data.refreshExpiresAt,
        userId:      data.userId,
        username:    data.username,
        fullName:    [data.firstName, data.middleName, data.lastName].filter(Boolean).join(' '),
        branchName:  data.branchName,
        roleName:    data.role,
        permissions: data.permissions || [],
    };
}

export function saveSession(session) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
}

// With sign-in turned off (NEXT_PUBLIC_AUTH_ENABLED=false) everyone is treated as a local admin.
export function getCurrentUser() {
    const s = getSession();
    if (s) return { username: s.username || 'user', name: s.fullName || s.username, role: s.roleName || 'No role', branch: s.branchName, userId: s.userId };
    return { username: 'admin', name: 'admin', role: AUTH_ENABLED ? 'Guest' : 'Super Admin', branch: null, userId: null };
}
