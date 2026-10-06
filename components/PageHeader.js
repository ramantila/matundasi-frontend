"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { breadcrumbsFor } from '@/lib/navigation';

export default function PageHeader({ title, children }) {
    const crumbs = breadcrumbsFor(usePathname());
    return (
        <div className="page-header">
            <h1 className="page-title">{title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                {children}
                <nav className="breadcrumb" aria-label="Breadcrumb">
                    {crumbs.map((c, i) => (
                        <React.Fragment key={i}>
                            {i > 0 && <span className="sep">/</span>}
                            {i === crumbs.length - 1
                                ? <span className="current">{c.label}</span>
                                : c.href ? <Link href={c.href}>{c.label}</Link> : <span className="plain">{c.label}</span>}
                        </React.Fragment>
                    ))}
                </nav>
            </div>
        </div>
    );
}
