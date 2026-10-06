"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api, { apiErrorMessage } from '@/services/interceptor';
import { saveSession, sessionFromLogin, AUTH_ENABLED } from '@/lib/session';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername]         = useState('');
    const [password, setPassword]         = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading]           = useState(false);
    const [error, setError]               = useState('');
    const [notice, setNotice]             = useState('');

    useEffect(() => {
        if (new URLSearchParams(window.location.search).get('reason') === 'expired') setNotice('Your session has expired. Please sign in again.');
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setNotice('');
        try {
            const { data: res } = await api.post('/api/v1/auth/login', { username, password });
            const data = res?.data ?? res;
            saveSession(sessionFromLogin(data));
            router.push('/dashboard');
        } catch (err) {
            setError(err?.response?.status === 401 ? 'Invalid username or password' : apiErrorMessage(err, 'Invalid username or password'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-panel">
                <div className="login-brand">
                    <img src="/logo-mark.svg" alt="" />
                    <span>Matundasi</span>
                </div>
                <div className="card login-card">
                    <h2>Sign in</h2>
                    <p className="muted" style={{ fontSize: 13.5, marginBottom: 24 }}>Welcome back. Enter your details to continue.</p>

                    {!AUTH_ENABLED && (
                        <div className="alert tone-amber">
                            <i className="fa-solid fa-circle-info" style={{ marginTop: 2 }} />
                            <div>
                                Sign-in is turned off (NEXT_PUBLIC_AUTH_ENABLED=false).{' '}
                                <Link href="/dashboard" style={{ fontWeight: 600, textDecoration: 'underline' }}>Continue to dashboard</Link>
                            </div>
                        </div>
                    )}

                    {notice && !error && (
                        <div className="alert tone-amber">
                            <i className="fa-solid fa-clock-rotate-left" style={{ marginTop: 2 }} />
                            {notice}
                        </div>
                    )}

                    {error && (
                        <div className="alert tone-red">
                            <i className="fa-solid fa-circle-exclamation" style={{ marginTop: 2 }} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-field" style={{ marginBottom: 16 }}>
                            <label className="form-label" htmlFor="username">Username</label>
                            <input id="username" className="form-input" type="text" value={username}
                                onChange={e => setUsername(e.target.value)} required autoFocus disabled={loading}
                                placeholder="Enter username" autoComplete="username" />
                        </div>

                        <div className="form-field" style={{ marginBottom: 24 }}>
                            <label className="form-label" htmlFor="password">Password</label>
                            <div className="input-wrap">
                                <input id="password" className="form-input has-suffix" type={showPassword ? 'text' : 'password'}
                                    value={password} onChange={e => setPassword(e.target.value)} required disabled={loading}
                                    placeholder="Enter password" autoComplete="current-password" />
                                <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    style={{ position: 'absolute', right: 12, background: 'none', border: 'none', color: 'var(--muted)' }}>
                                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', height: 46 }}>
                            {loading
                                ? <><i className="fa-solid fa-spinner fa-spin" /> Signing in…</>
                                : <><i className="fa-solid fa-right-to-bracket" /> Sign in</>}
                        </button>
                    </form>
                </div>
                <p className="login-copy">© {new Date().getFullYear()} Matundasi Portal</p>
            </div>
        </div>
    );
}
