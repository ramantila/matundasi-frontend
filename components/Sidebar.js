"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV } from '@/lib/navigation';
import { hasPermission } from '@/lib/permissions';

// A child link is active on its own page (and any nested page under it).
const isUnder = (pathname, href) => pathname === href || pathname.startsWith(`${href}/`);

export default function Sidebar({ onClose }) {
    const pathname = usePathname();
    const [openGroup, setOpenGroup] = useState(null);
    const [ready, setReady] = useState(false);

    useEffect(() => { setReady(true); }, []);

    // Fall back to auto-opening the group that contains the current page after each navigation.
    useEffect(() => { setOpenGroup(null); }, [pathname]);

    const can = (permission) => !ready || hasPermission(permission);

    const renderItem = (item) => {
        if (item.children) {
            const children = item.children.filter(c => can(c.permission));
            if (!children.length) return null;
            const groupActive = children.some(c => isUnder(pathname, c.href));
            const open = openGroup === item.id || (openGroup === null && groupActive);
            return (
                <div key={item.id}>
                    <button className={`sidebar-link ${open ? 'open' : ''} ${groupActive ? 'active' : ''}`}
                        onClick={() => setOpenGroup(open ? '' : item.id)} aria-expanded={open}>
                        <span className="icon"><i className={`fa-solid ${item.icon}`} /></span>
                        <span>{item.label}</span>
                        <i className="fa-solid fa-chevron-right arrow" />
                    </button>
                    <div className={`sidebar-submenu ${open ? 'open' : ''}`}>
                        {children.map(child => (
                            <Link key={child.href} href={child.href}
                                className={`sidebar-sublink ${isUnder(pathname, child.href) ? 'active' : ''}`}>
                                {child.label}
                            </Link>
                        ))}
                    </div>
                </div>
            );
        }
        return (
            <Link key={item.id} href={item.href} className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}>
                <span className="icon"><i className={`fa-solid ${item.icon}`} /></span>
                <span>{item.label}</span>
            </Link>
        );
    };

    return (
        <>
            <div className="sidebar-overlay" onClick={onClose} />
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <img src="/logo-mark.svg" alt="" />
                    <span className="sidebar-logo-text">Matundasi</span>
                    <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>
                <nav className="sidebar-nav">
                    {NAV.map(section => (
                        <div key={section.section} className="sidebar-section">
                            <div className="sidebar-section-label">{section.section}</div>
                            {section.items.map(renderItem)}
                        </div>
                    ))}
                </nav>
            </aside>
        </>
    );
}
