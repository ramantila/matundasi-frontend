"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';

// Searchable dropdown for enum and foreign-key fields. options: [{ value, label }]
export default function SelectField({ id, value, options, onChange, placeholder = 'Select…', loading, disabled, invalid, clearable = true, className = '' }) {
    const [open, setOpen]   = useState(false);
    const [up, setUp]       = useState(false);
    const [query, setQuery] = useState('');
    const ref = useRef(null);
    const searchRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', close);
        searchRef.current?.focus();
        return () => document.removeEventListener('mousedown', close);
    }, [open]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q ? options.filter(o => String(o.label).toLowerCase().includes(q)) : options;
    }, [options, query]);

    const selected = options.find(o => String(o.value) === String(value));
    const isDisabled = disabled || loading;

    const pick = (v) => { onChange(v); setOpen(false); setQuery(''); };

    return (
        <div className={`select-box ${open ? 'open' : ''}`} ref={ref}>
            <button type="button" id={id} className={`select-trigger ${className} ${invalid ? 'invalid' : ''}`} disabled={isDisabled}
                onClick={() => { if (!open && ref.current) setUp(ref.current.getBoundingClientRect().bottom + 300 > window.innerHeight); setOpen(v => !v); }} onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }}
                aria-haspopup="listbox" aria-expanded={open}>
                {loading
                    ? <span className="placeholder"><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 6 }} />Loading…</span>
                    : selected
                        ? <span className="value">{selected.label}</span>
                        : <span className="placeholder">{value ? 'Unknown record' : placeholder}</span>}
                <i className="fa-solid fa-chevron-down chev" />
            </button>
            {clearable && value && !isDisabled && (
                <button type="button" className="select-clear" onClick={() => onChange('')} aria-label="Clear selection">
                    <i className="fa-solid fa-xmark" />
                </button>
            )}
            {open && (
                <div className={`popover select-menu ${up ? 'up' : ''}`} role="listbox">
                    {options.length > 7 && (
                        <div className="select-menu-search">
                            <input ref={searchRef} type="text" placeholder="Search…" value={query} onChange={e => setQuery(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && filtered[0]) { e.preventDefault(); pick(filtered[0].value); } if (e.key === 'Escape') setOpen(false); }} />
                        </div>
                    )}
                    <div className="select-menu-list">
                        {filtered.length === 0
                            ? <div className="popover-empty">{options.length ? 'No matches' : 'No records yet'}</div>
                            : filtered.slice(0, 200).map(o => (
                                <button type="button" key={o.value} role="option" aria-selected={String(o.value) === String(value)}
                                    className={`popover-item ${String(o.value) === String(value) ? 'selected' : ''}`}
                                    onClick={() => pick(o.value)}>
                                    {o.label}
                                </button>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
