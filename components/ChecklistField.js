"use client";
import React, { useState, useMemo } from 'react';

// Multi-select as a searchable checkbox list. value: array of id strings; options: [{ value, label }].
// groupBy(option) → group name splits the list into sections that can be toggled as a whole;
// itemLabel(option) shortens the text shown inside a group (search still matches the full label).
export default function ChecklistField({ id, label, value, options, onChange, loading, disabled, invalid, required, groupBy, itemLabel }) {
    const [query, setQuery] = useState('');
    const selected = useMemo(() => new Set(value || []), [value]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q ? options.filter(o => String(o.label).toLowerCase().includes(q)) : options;
    }, [options, query]);

    const groups = useMemo(() => {
        if (!groupBy) return [{ name: null, items: filtered }];
        const map = new Map();
        for (const o of filtered) {
            const g = groupBy(o);
            if (!map.has(g)) map.set(g, []);
            map.get(g).push(o);
        }
        return [...map].sort(([a], [b]) => a.localeCompare(b)).map(([name, items]) => ({ name, items }));
    }, [filtered, groupBy]);

    // Ids still selected but no longer offered (deleted or deactivated) — shown so they can be removed.
    const known = useMemo(() => new Set(options.map(o => String(o.value))), [options]);
    const orphans = loading ? [] : [...selected].filter(v => !known.has(v));

    const setMany = (items, on) => {
        const next = new Set(selected);
        items.forEach(o => on ? next.add(String(o.value)) : next.delete(String(o.value)));
        onChange([...next]);
    };
    const toggle = (v) => setMany([{ value: v }], !selected.has(String(v)));
    const allOn = (items) => items.length > 0 && items.every(o => selected.has(String(o.value)));

    return (
        <div className={`checklist ${invalid ? 'invalid' : ''} ${disabled ? 'disabled' : ''}`} id={id}>
            <div className="checklist-head">
                <span className="checklist-title">
                    {label}{required && <span className="req">*</span>}
                    <span className="checklist-count">{selected.size} selected</span>
                </span>
                {options.length > 7 && (
                    <div className="checklist-search">
                        <i className="fa-solid fa-magnifying-glass" />
                        <input type="text" placeholder="Search…" value={query} onChange={e => setQuery(e.target.value)}
                            disabled={disabled} aria-label={`Search ${label.toLowerCase()}`} />
                    </div>
                )}
                {filtered.length > 0 && (
                    <button type="button" className="checklist-link" disabled={disabled}
                        onClick={() => setMany(filtered, !allOn(filtered))}>
                        {allOn(filtered) ? 'Clear all' : 'Select all'}
                    </button>
                )}
            </div>

            <div className="checklist-body">
                {loading ? (
                    <div className="popover-empty"><i className="fa-solid fa-spinner fa-spin" /> Loading…</div>
                ) : filtered.length === 0 && orphans.length === 0 ? (
                    <div className="popover-empty">{options.length ? 'No matches' : 'No records yet'}</div>
                ) : (
                    <>
                        {groups.map(g => (
                            <div key={g.name ?? '_'} className="checklist-group">
                                {g.name && (
                                    <label className="checklist-group-title">
                                        <input type="checkbox" checked={allOn(g.items)} disabled={disabled}
                                            ref={el => { if (el) el.indeterminate = !allOn(g.items) && g.items.some(o => selected.has(String(o.value))); }}
                                            onChange={() => setMany(g.items, !allOn(g.items))} />
                                        {g.name}
                                    </label>
                                )}
                                <div className="checklist-items">
                                    {g.items.map(o => (
                                        <label key={o.value} className="checklist-item">
                                            <input type="checkbox" checked={selected.has(String(o.value))} disabled={disabled}
                                                onChange={() => toggle(o.value)} />
                                            <span title={o.label}>{itemLabel ? itemLabel(o) : o.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {orphans.map(v => (
                            <label key={v} className="checklist-item muted">
                                <input type="checkbox" checked disabled={disabled} onChange={() => toggle(v)} />
                                <span>Unavailable (inactive or deleted)</span>
                            </label>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}
