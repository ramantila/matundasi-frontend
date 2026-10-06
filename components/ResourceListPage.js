"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'react-toastify';
import PageHeader from './PageHeader';
import StatCard from './StatCard';
import RowActions from './RowActions';
import ConfirmModal from './ConfirmModal';
import DetailModal from './DetailModal';
import ResourceFormModal from './ResourceFormModal';
import TablePagination from './TablePagination';
import useLookups, { lookupRefs } from '@/lib/useLookups';
import { hasPermission } from '@/lib/permissions';
import { apiErrorMessage } from '@/services/interceptor';
import { isBlank, formatNumber, formatDate, formatMoney } from '@/lib/format';
import { relationLabel, exportValue, columnText } from '@/lib/display';
import { exportReportToExcel, exportReportToPdf } from '@/lib/reportExport';

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

function compareValues(a, b) {
    if (isBlank(a) && isBlank(b)) return 0;
    if (isBlank(a)) return 1;            // blanks always last
    if (isBlank(b)) return -1;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return collator.compare(String(a), String(b));
}

function renderCell(col, row, lookups) {
    const v = row[col.key];
    if (col.format !== 'bool' && isBlank(v)) return <span className="muted">—</span>;
    switch (col.format) {
        case 'number':   return formatNumber(v);
        case 'date':     return formatDate(v);
        case 'money':    return formatMoney(v);
        case 'chip':     return <span className="chip">{v}</span>;
        case 'bool':     return v ? 'Yes' : 'No';
        case 'relation': return relationLabel(lookups, col.ref, v);
        default:         return String(v);
    }
}

function ExportMenu({ disabled, onExport }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        if (!open) return;
        const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [open]);
    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button className="btn-outline" onClick={() => setOpen(v => !v)} disabled={disabled} aria-haspopup="menu" aria-expanded={open}>
                <i className="fa-solid fa-download" /> Export
            </button>
            {open && (
                <div className="popover" role="menu" style={{ minWidth: 170 }}>
                    <button className="popover-item" role="menuitem" onClick={() => { setOpen(false); onExport('excel'); }}>
                        <i className="fa-solid fa-file-excel" /> Excel (.xlsx)
                    </button>
                    <button className="popover-item" role="menuitem" onClick={() => { setOpen(false); onExport('pdf'); }}>
                        <i className="fa-solid fa-file-pdf" /> PDF
                    </button>
                </div>
            )}
        </div>
    );
}

export default function ResourceListPage({ resource }) {
    const { title, singular, primary, columns, order, status, filter } = resource;

    const [rows, setRows]               = useState([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState(null);
    const [search, setSearch]           = useState('');
    const [filterValue, setFilterValue] = useState('');
    const [page, setPage]               = useState(1);
    const [pageSize, setPageSize]       = useState(10);
    const [sort, setSort]               = useState({ key: order || primary?.key || null, dir: 'asc' });
    const [viewTarget, setViewTarget]     = useState(null);
    const [formTarget, setFormTarget]     = useState(null);   // { id?: string } — no id means create
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting]         = useState(false);
    const [can, setCan] = useState({ view: true, add: false, edit: false, delete: false });
    const [actionTarget, setActionTarget] = useState(null);   // { action, row } for a resource's extra row action
    const [runningTool, setRunningTool]   = useState(null);

    const { lookups } = useLookups(lookupRefs(resource.fields));
    // Passwords and other write-only fields never appear in views or exports.
    const readableFields = resource.fields.filter(f => f.type !== 'password');

    const fetchRows = () => {
        setLoading(true); setError(null);
        resource.service.list()
            .then(data => setRows(Array.isArray(data) ? data : []))
            .catch(err => setError(apiErrorMessage(err, `Failed to load ${title.toLowerCase()}`)))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchRows();
        setCan({
            view:   hasPermission(resource.permissions.view),
            add:    hasPermission(resource.permissions.add),
            edit:   hasPermission(resource.permissions.edit),
            delete: hasPermission(resource.permissions.delete),
        });
    }, [resource.slug]);

    useEffect(() => { setPage(1); }, [search, filterValue, pageSize]);

    const primaryLabel = primary && resource.fields.find(f => f.name === primary.key)?.label;

    const filterOptions = useMemo(() => {
        if (!filter) return [];
        return [...new Set(rows.map(r => r[filter.key]).filter(v => !isBlank(v)).map(String))].sort(collator.compare);
    }, [rows, filter]);

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        const keys = [primary?.key, primary?.sub, order, ...columns.map(c => c.key)].filter(Boolean);
        let out = rows;
        if (filter && filterValue) out = out.filter(r => String(r[filter.key] ?? '') === filterValue);
        if (q) {
            out = out.filter(r => keys.some(k => {
                const col = columns.find(c => c.key === k);
                const text = col ? columnText(col, r, lookups) : r[k];
                return String(text ?? '').toLowerCase().includes(q);
            }));
        }
        if (sort.key) {
            const col = columns.find(c => c.key === sort.key);
            const value = (r) => col?.format === 'relation' ? relationLabel(lookups, col.ref, r[sort.key]) : r[sort.key];
            out = [...out].sort((a, b) => compareValues(value(a), value(b)) * (sort.dir === 'asc' ? 1 : -1));
        }
        return out;
    }, [rows, search, filterValue, sort, lookups]);

    const pageRows = visible.slice((page - 1) * pageSize, page * pageSize);
    const stats    = resource.stats.map(fn => fn(rows));

    const toggleSort = (key) => setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });

    const SortHeader = ({ k, children }) => (
        <th className={`sortable ${sort.key === k ? 'sorted' : ''}`} onClick={() => toggleSort(k)}
            aria-sort={sort.key === k ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
            {children}
            <i className={`fa-solid ${sort.key === k ? (sort.dir === 'asc' ? 'fa-arrow-up' : 'fa-arrow-down') : 'fa-arrows-up-down'} sort-icon`} />
        </th>
    );

    const handleDeleteConfirm = async () => {
        setDeleting(true);
        try {
            await resource.service.remove(deleteTarget.id);
            toast.success(`${singular} deleted`);
            setDeleteTarget(null);
            fetchRows();
        } catch (err) {
            toast.error(apiErrorMessage(err, `Failed to delete ${singular.toLowerCase()}`));
        } finally {
            setDeleting(false);
        }
    };

    const handleExport = (kind) => {
        const stamp = new Date().toISOString().slice(0, 10);
        const subtitle = `${visible.length} record${visible.length === 1 ? '' : 's'}${filterValue ? ` · ${filterValue}` : ''}${search ? ` · “${search}”` : ''} · exported ${stamp}`;
        const filename = `${resource.slug}-${stamp}`;
        if (kind === 'excel') {
            // Excel gets every field of the record
            const cols = readableFields.map(f => ({ key: f.name, header: f.label }));
            const data = visible.map(r => Object.fromEntries(readableFields.map(f => [f.name, exportValue(f, r[f.name], lookups)])));
            exportReportToExcel({ title, subtitle, rows: data, columns: cols, filename });
        } else {
            // PDF mirrors the on-screen columns so it fits a landscape page
            const cols = [
                ...(order ? [{ key: order, header: 'Order' }] : []),
                ...(primary ? [{ key: primary.key, header: primaryLabel }] : []),
                ...(primary?.sub ? [{ key: primary.sub, header: resource.fields.find(f => f.name === primary.sub)?.label }] : []),
                ...columns.filter(c => c.key !== primary?.sub).map(c => ({ key: c.key, header: c.label, col: c })),
                ...(status ? [{ key: '__status', header: 'Status' }] : []),
            ];
            const data = visible.map(r => Object.fromEntries(cols.map(c => [c.key,
                c.key === '__status' ? status(r).label : c.col ? columnText(c.col, r, lookups) : (r[c.key] ?? '')])));
            exportReportToPdf({ title, subtitle, rows: data, columns: cols, filename });
        }
    };

    // Toolbar tools (e.g. "Add missing permissions"): run(rows) resolves to a success message.
    const runTool = async (tool) => {
        setRunningTool(tool.label);
        try {
            const message = await tool.run(rows);
            toast.success(message || 'Done');
            fetchRows();
        } catch (err) {
            toast.error(apiErrorMessage(err, `${tool.label} failed`));
        } finally {
            setRunningTool(null);
        }
    };

    if (!can.view) return (
        <>
            <PageHeader title={title} />
            <div className="card table-empty error"><i className="fa-solid fa-lock" />You don&apos;t have permission to view {title.toLowerCase()}.</div>
        </>
    );

    const colCount = (order ? 1 : 0) + 1 + columns.length + (status ? 1 : 0) + 1;

    return (
        <>
            {deleteTarget && (
                <ConfirmModal
                    title={`Delete ${singular.toLowerCase()}`}
                    message={<>Are you sure you want to delete <strong>{resource.label(deleteTarget)}</strong>? This action cannot be undone.</>}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteTarget(null)}
                    loading={deleting}
                />
            )}
            {viewTarget && (
                <DetailModal resource={resource} row={viewTarget} lookups={lookups}
                    onClose={() => setViewTarget(null)}
                    onEdit={can.edit ? () => { setFormTarget({ id: viewTarget.id }); setViewTarget(null); } : undefined} />
            )}
            {formTarget && (
                <ResourceFormModal resource={resource} id={formTarget.id}
                    onClose={() => setFormTarget(null)} onSaved={fetchRows} />
            )}
            {actionTarget && (
                <actionTarget.action.Modal resource={resource} row={actionTarget.row}
                    onClose={() => setActionTarget(null)} onDone={fetchRows} />
            )}

            <PageHeader title={title} />

            <div className="stats-grid">
                {stats.map(s => <StatCard key={s.label} {...s} loading={loading && !rows.length} />)}
            </div>

            <div className="card table-card">
                {loading && rows.length > 0 && <div className="table-loading"><i className="fa-solid fa-spinner fa-spin spin-lg" /></div>}

                <div className="table-toolbar">
                    <div className="search-pill">
                        <i className="fa-solid fa-magnifying-glass" />
                        <input type="text" placeholder={`Search ${title.toLowerCase()}…`} value={search}
                            onChange={e => setSearch(e.target.value)} aria-label={`Search ${title.toLowerCase()}`} />
                    </div>
                    {filter && (
                        <div className="select-outline">
                            <select value={filterValue} onChange={e => setFilterValue(e.target.value)} aria-label={`Filter by ${filter.label}`}>
                                <option value="">All {filter.label}</option>
                                {filterOptions.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="spacer" />
                    {(resource.tools || []).filter(t => can[t.permission || 'view']).map(t => (
                        <button key={t.label} className="btn-outline" onClick={() => runTool(t)} disabled={!!runningTool || loading} title={t.hint}>
                            <i className={`fa-solid ${runningTool === t.label ? 'fa-spinner fa-spin' : t.icon}`} /> {t.label}
                        </button>
                    ))}
                    <ExportMenu disabled={!visible.length} onExport={handleExport} />
                    {can.add && (
                        <button className="btn-primary" onClick={() => setFormTarget({})}>
                            <i className="fa-solid fa-plus" /> New {singular}
                        </button>
                    )}
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                {order && <SortHeader k={order}>Order</SortHeader>}
                                {primary ? <SortHeader k={primary.key}>{primaryLabel}</SortHeader> : <th>#</th>}
                                {columns.map(c => <SortHeader key={c.key} k={c.key}>{c.label}</SortHeader>)}
                                {status && <th>Status</th>}
                                <th style={{ textAlign: 'center', width: 90 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && !rows.length ? (
                                <tr><td colSpan={colCount}><div className="table-empty"><i className="fa-solid fa-spinner fa-spin" />Loading {title.toLowerCase()}…</div></td></tr>
                            ) : error ? (
                                <tr><td colSpan={colCount}><div className="table-empty error">
                                    <i className="fa-solid fa-circle-exclamation" />{error}
                                    <div><button className="btn-outline" onClick={fetchRows}><i className="fa-solid fa-rotate-right" /> Retry</button></div>
                                </div></td></tr>
                            ) : pageRows.length === 0 ? (
                                <tr><td colSpan={colCount}><div className="table-empty">
                                    <i className="fa-solid fa-inbox" />
                                    {rows.length ? 'No records match your search' : `No ${title.toLowerCase()} yet`}
                                </div></td></tr>
                            ) : pageRows.map((row, i) => (
                                <tr key={row.id}>
                                    {order && <td className="num">{row[order] ?? '—'}</td>}
                                    {primary ? (
                                        <td>
                                            <div className="name-cell">
                                                <span className="name-tile"><i className={`fa-solid ${resource.icon}`} /></span>
                                                <div style={{ minWidth: 0 }}>
                                                    <div className="name-title">{row[primary.key] ?? '—'}</div>
                                                    {primary.sub && !isBlank(row[primary.sub]) && <div className="name-sub">{row[primary.sub]}</div>}
                                                </div>
                                            </div>
                                        </td>
                                    ) : <td className="num">{(page - 1) * pageSize + i + 1}</td>}
                                    {columns.map(c => (
                                        <td key={c.key} className={c.format === 'number' || c.format === 'money' ? 'num' : undefined}>{renderCell(c, row, lookups)}</td>
                                    ))}
                                    {status && (() => { const s = status(row); return <td><span className={`status-chip tone-${s.tone}`}>{s.label}</span></td>; })()}
                                    <td style={{ textAlign: 'center' }}>
                                        <RowActions actions={[
                                            { label: 'View details', icon: 'fa-eye', onClick: () => setViewTarget(row) },
                                            { label: 'Edit', icon: 'fa-pen', onClick: () => setFormTarget({ id: row.id }), hidden: !can.edit },
                                            ...(resource.rowActions || []).map(a => ({
                                                label: a.label, icon: a.icon, onClick: () => setActionTarget({ action: a, row }), hidden: !can[a.permission || 'view'],
                                            })),
                                            { label: 'Delete', icon: 'fa-trash', danger: true, onClick: () => setDeleteTarget(row), hidden: !can.delete },
                                        ]} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <TablePagination page={page} pageSize={pageSize} total={visible.length} onPage={setPage} onPageSize={setPageSize} />
            </div>
        </>
    );
}
