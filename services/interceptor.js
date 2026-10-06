"use client";
import axios from 'axios';
import { getSession, accessMsLeft, AUTH_ENABLED } from '@/lib/session';
import { refreshSession } from './auth';

// Empty baseURL = same origin; next.config.mjs proxies /api/* to the Spring Boot backend.
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || '',
});

const RENEW_BEFORE_MS = 15_000;   // refresh this close to the access token's expiry instead of sending it
const isAuthCall = (config) => !!config?.url?.includes('/api/v1/auth/');
const toLogin = () => { window.location.href = '/login?reason=expired'; };
const expired = () => { toLogin(); return Promise.reject(new axios.CanceledError('Session expired')); };

api.interceptors.request.use(async (config) => {
    if (isAuthCall(config) || typeof window === 'undefined') return config;
    let session = getSession();
    if (session?.refreshToken && accessMsLeft(session) < RENEW_BEFORE_MS) {
        session = (await refreshSession()) ?? getSession();
    }
    // No session left (never signed in, or the refresh token expired/was revoked).
    if (AUTH_ENABLED && !session) return expired();
    if (session?.accessToken) config.headers.Authorization = `Bearer ${session.accessToken}`;
    return config;
});

// A 401 means the access token was rejected: refresh once and replay the request.
api.interceptors.response.use(
    res => res,
    async (err) => {
        const config = err.config;
        if (AUTH_ENABLED && err.response?.status === 401 && config && !config._retried && !isAuthCall(config) && typeof window !== 'undefined') {
            config._retried = true;
            const session = await refreshSession();
            if (session) {
                config.headers.Authorization = `Bearer ${session.accessToken}`;
                return api(config);
            }
            if (!getSession()) return expired();
        }
        return Promise.reject(err);
    }
);

// Backend wraps every payload as { success, message, statusCode, status, data, timestamp }.
export const unwrap = (res) => res.data?.data;

// Human-readable message from a backend error ({ message, data: { field: error } } on validation failures).
export function apiErrorMessage(err, fallback = 'Something went wrong') {
    if (!err?.response) return 'Cannot reach the server. Is the backend running?';
    return err.response.data?.message || fallback;
}

export function apiFieldErrors(err) {
    const data = err?.response?.data?.data;
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
}

export default api;
