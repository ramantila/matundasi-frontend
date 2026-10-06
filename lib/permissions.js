import { getSession, AUTH_ENABLED } from './session';

export function getPermissions() {
    return new Set(getSession()?.permissions || []);
}

export function hasPermission(name) {
    if (!AUTH_ENABLED || !name) return true;
    return getPermissions().has(name);
}
