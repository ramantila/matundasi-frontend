"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { RESOURCE_LIST, GROUPS } from '@/lib/resources';
import { getCurrentUser, AUTH_ENABLED } from '@/lib/session';
import { logout } from '@/services/auth';
import { hasPermission } from '@/lib/permissions';
import { getTheme, setTheme } from '@/lib/theme';

function useClickOutside(onOutside) {
    const ref = useRef(null);
    useEffect(() => {
        const close = (e) => { if (ref.current && !ref.current.contains(e.target)) onOutside(); };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);
    return ref;
}

function ModuleSearch() {
    const router = useRouter();
    const [query, setQuery]   = useState('');
    const [open, setOpen]     = useState(false);
    const [cursor, setCursor] = useState(0);
    const ref = useClickOutside(() => setOpen(false));

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return [];
        return RESOURCE_LIST
            .filter(r => hasPermission(r.permissions.view))
            .filter(r => r.title.toLowerCase().includes(q) || GROUPS[r.group].label.toLowerCase().includes(q))
            .slice(0, 8);
    }, [query]);

    const go = (r) => { router.push(r.href); setQuery(''); setOpen(false); };

    const onKeyDown = (e) => {
        if (!results.length) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => (c + 1) % results.length); }
        if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => (c - 1 + results.length) % results.length); }
        if (e.key === 'Enter')     { e.preventDefault(); go(results[cursor]); }
        if (e.key === 'Escape')    setOpen(false);
    };

    return (
        <div className="topbar-search" ref={ref}>
            <i className="fa-solid fa-magnifying-glass" />
            <input type="text" placeholder="Search" value={query} aria-label="Search modules"
                onChange={e => { setQuery(e.target.value); setOpen(true); setCursor(0); }}
                onFocus={() => setOpen(true)} onKeyDown={onKeyDown} />
            {open && query.trim() && (
                <div className="popover" style={{ left: 0, right: 0 }}>
                    {results.length === 0
                        ? <div className="popover-empty">No modules match “{query}”</div>
                        : results.map((r, i) => (
                            <button key={r.slug} className={`popover-item ${i === cursor ? 'focused' : ''}`}
                                onMouseEnter={() => setCursor(i)} onClick={() => go(r)}>
                                <i className={`fa-solid ${r.icon}`} />
                                {r.title}
                                <span className="popover-meta">{GROUPS[r.group].label}</span>
                            </button>
                        ))}
                </div>
            )}
        </div>
    );
}

export default function Navbar({ onToggleSidebar }) {
    const [user, setUser]         = useState({ username: '', role: '' });
    const [theme, setThemeState]  = useState('light');
    const [menuOpen, setMenuOpen] = useState(false);
    const [bellOpen, setBellOpen] = useState(false);
    const menuRef = useClickOutside(() => setMenuOpen(false));
    const bellRef = useClickOutside(() => setBellOpen(false));

    useEffect(() => {
        setUser(getCurrentUser());
        setThemeState(getTheme());
    }, []);

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        setThemeState(next);
    };

    const handleLogout = async () => { await logout(); window.location.href = '/login'; };

    const initials = (user.name || user.username || '?').split(/[.\s_-]+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();

    return (
        <header className="topbar">
            <div className="topbar-left">
                <button className="topbar-hamburger" onClick={onToggleSidebar} aria-label="Toggle menu">
                    <i className="fa-solid fa-bars" />
                </button>
                <div className="topbar-welcome">
                    <h2>Welcome, {user.name || user.username}</h2>
                    <p>Here&apos;s what&apos;s happening with your exploration data today.</p>
                </div>
            </div>

            <div className="topbar-right">
                <ModuleSearch />

                <button className="icon-btn" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
                    <i className={theme === 'dark' ? 'fa-regular fa-sun' : 'fa-regular fa-moon'} />
                </button>

                <div ref={bellRef} style={{ position: 'relative' }}>
                    <button className="icon-btn raised" onClick={() => setBellOpen(v => !v)} aria-label="Notifications">
                        <i className="fa-solid fa-bell" />
                    </button>
                    {bellOpen && (
                        <div className="popover" style={{ width: 300 }}>
                            <div className="popover-header" style={{ fontWeight: 600 }}>Notifications</div>
                            <div className="popover-divider" />
                            <div className="popover-empty"><i className="fa-regular fa-bell-slash" style={{ display: 'block', fontSize: 22, marginBottom: 8 }} />You&apos;re all caught up</div>
                        </div>
                    )}
                </div>

                <div ref={menuRef} style={{ position: 'relative' }}>
                    <button className="user-chip" onClick={() => setMenuOpen(v => !v)} aria-haspopup="menu" aria-expanded={menuOpen}>
                        <span className="avatar">{initials}</span>
                        <span className="user-chip-text">
                            <span className="user-chip-name">{user.username} <i className="fa-solid fa-chevron-down" style={{ fontSize: 10 }} /></span>
                            <span className="user-chip-role">{user.role}</span>
                        </span>
                    </button>
                    {menuOpen && (
                        <div className="popover" role="menu" style={{ width: 260 }}>
                            <div className="popover-header" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                <span className="avatar">{initials}</span>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 600 }}>{user.name || user.username}</div>
                                    <div className="muted" style={{ fontSize: 12.5 }}>{user.role}{user.branch ? ` · ${user.branch}` : ''}</div>
                                </div>
                            </div>
                            <div className="popover-divider" />
                            <button className="popover-item" onClick={toggleTheme}>
                                <i className={theme === 'dark' ? 'fa-regular fa-sun' : 'fa-regular fa-moon'} />
                                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                            </button>
                            {AUTH_ENABLED && (
                                <>
                                    <div className="popover-divider" />
                                    <button className="popover-item danger" onClick={handleLogout}>
                                        <i className="fa-solid fa-right-from-bracket" /> Logout
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
