"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import { RESOURCES, RESOURCE_LIST, GROUPS } from '@/lib/resources';
import { hasPermission } from '@/lib/permissions';
import { formatDate, formatMoney, sum, isBlank } from '@/lib/format';
import { relationLabel } from '@/lib/display';

const TONES = { exploration: 'teal', drilling: 'blue', assays: 'amber', lab: 'purple', lookups: 'green' };

// The backend has no count endpoints yet, so the overview loads a few lists and summarises them client-side.
const SOURCES = ['projects', 'collars', 'samples', 'dispatches', 'invoices'];

const byDateDesc = (key) => (a, b) => String(b[key] ?? '').localeCompare(String(a[key] ?? ''));

function RecentPanel({ title, href, rows, empty, render }) {
    return (
        <div className="card">
            <div className="panel-header">
                <span className="panel-title">{title}</span>
                <Link href={href} className="panel-link">View all <i className="fa-solid fa-arrow-right" style={{ fontSize: 11 }} /></Link>
            </div>
            {rows === null ? (
                <div className="table-empty"><i className="fa-solid fa-spinner fa-spin" />Loading…</div>
            ) : rows === undefined ? (
                <div className="table-empty error"><i className="fa-solid fa-circle-exclamation" />Couldn&apos;t load data</div>
            ) : rows.length === 0 ? (
                <div className="table-empty"><i className="fa-solid fa-inbox" />{empty}</div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table"><tbody>{rows.map(render)}</tbody></table>
                </div>
            )}
        </div>
    );
}

export default function DashboardPage() {
    // null = loading, undefined = failed, array = loaded
    const [data, setData] = useState(Object.fromEntries(SOURCES.map(s => [s, null])));
    const [modules, setModules] = useState(RESOURCE_LIST);

    useEffect(() => {
        setModules(RESOURCE_LIST.filter(r => hasPermission(r.permissions.view)));
        Promise.allSettled(SOURCES.map(s => RESOURCES[s].service.list())).then(results => {
            setData(Object.fromEntries(results.map((res, i) => [SOURCES[i], res.status === 'fulfilled' ? res.value : undefined])));
        });
    }, []);

    const count = (key) => (Array.isArray(data[key]) ? data[key].length : data[key] === null ? null : '—');
    const projectLookup = { projects: { map: new Map((data.projects || []).map(p => [String(p.id), p.name])) } };

    const stats = [
        { label: 'Projects',        value: count('projects'),  icon: 'fa-folder-open',         tone: 'teal' },
        { label: 'Drill collars',   value: count('collars'),   icon: 'fa-location-crosshairs', tone: 'blue' },
        { label: 'Samples',         value: count('samples'),   icon: 'fa-vial',                tone: 'amber' },
        { label: 'Invoiced (USD)',  value: Array.isArray(data.invoices) ? sum(data.invoices, 'amountInUs') : data.invoices === null ? null : '—', icon: 'fa-sack-dollar', tone: 'purple', format: 'money' },
    ];

    const failed = SOURCES.filter(s => data[s] === undefined);

    return (
        <>
            <PageHeader title="Dashboard" />

            {failed.length === SOURCES.length && (
                <div className="alert tone-red" style={{ marginBottom: 22 }}>
                    <i className="fa-solid fa-plug-circle-xmark" style={{ marginTop: 2 }} />
                    <div>Can&apos;t reach the backend. Check that matundasi-backend is running and that <code>BACKEND_URL</code> in <code>.env.local</code> points to it.</div>
                </div>
            )}

            <div className="stats-grid">
                {stats.map(s => <StatCard key={s.label} {...s} loading={s.value === null} />)}
            </div>

            <div className="dash-grid">
                <RecentPanel title="Recent dispatches" href={RESOURCES.dispatches.href}
                    rows={Array.isArray(data.dispatches) ? [...data.dispatches].sort(byDateDesc('dispatchDate')).slice(0, 5) : data.dispatches}
                    empty="No dispatches yet"
                    render={d => (
                        <tr key={d.id}>
                            <td>
                                <div className="name-cell">
                                    <span className="name-tile"><i className="fa-solid fa-truck-fast" /></span>
                                    <div>
                                        <div className="name-title">#{d.orderNumber} {d.batch && `· ${d.batch}`}</div>
                                        <div className="name-sub">{relationLabel(projectLookup, 'projects', d.projectId)}{d.lab ? ` → ${d.lab}` : ''}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="num">{isBlank(d.numberOfSamples) ? '—' : `${d.numberOfSamples} samples`}</td>
                            <td>{formatDate(d.dispatchDate)}</td>
                            <td>{d.dateReceived
                                ? <span className="status-chip tone-green">Received</span>
                                : <span className="status-chip tone-amber">In transit</span>}</td>
                        </tr>
                    )} />

                <RecentPanel title="Recent invoices" href={RESOURCES.invoices.href}
                    rows={Array.isArray(data.invoices) ? [...data.invoices].sort(byDateDesc('invoiceDate')).slice(0, 5) : data.invoices}
                    empty="No invoices yet"
                    render={inv => (
                        <tr key={inv.id}>
                            <td>
                                <div className="name-cell">
                                    <span className="name-tile"><i className="fa-solid fa-file-invoice-dollar" /></span>
                                    <div>
                                        <div className="name-title">{inv.invoiceNumber}</div>
                                        <div className="name-sub">{inv.labName || '—'}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="num">{formatMoney(inv.amountInUs)}</td>
                            <td>{formatDate(inv.invoiceDate)}</td>
                            <td>{inv.dateApproved
                                ? <span className="status-chip tone-green">Approved</span>
                                : <span className="status-chip tone-amber">Pending</span>}</td>
                        </tr>
                    )} />
            </div>

            {Object.entries(GROUPS).map(([groupId, group]) => {
                const items = modules.filter(r => r.group === groupId);
                if (!items.length) return null;
                return (
                    <section key={groupId}>
                        <h2 className="section-title">{group.label}</h2>
                        <div className="module-grid">
                            {items.map(r => (
                                <Link key={r.slug} href={r.href} className="card module-card">
                                    <span className={`stat-icon tone-${TONES[groupId]}`}><i className={`fa-solid ${r.icon}`} /></span>
                                    <span className="module-name">{r.title}</span>
                                </Link>
                            ))}
                        </div>
                    </section>
                );
            })}
        </>
    );
}
