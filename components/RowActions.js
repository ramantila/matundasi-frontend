"use client";
import React, { useState, useEffect, useRef } from 'react';

// Kebab (⋮) menu. Opens upward when there isn't room below.
export default function RowActions({ actions }) {
    const [open, setOpen] = useState(false);
    const [up, setUp]     = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', close);
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', onKey); };
    }, [open]);

    const toggle = () => {
        if (!open && ref.current) setUp(ref.current.getBoundingClientRect().bottom + 170 > window.innerHeight);
        setOpen(v => !v);
    };

    const visible = actions.filter(a => !a.hidden);
    if (!visible.length) return null;

    return (
        <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
            <button className="row-menu-btn" onClick={toggle} aria-label="Row actions" aria-haspopup="menu" aria-expanded={open}>
                <i className="fa-solid fa-ellipsis-vertical" />
            </button>
            {open && (
                <div className="popover" role="menu" style={{ minWidth: 170, ...(up ? { top: 'auto', bottom: 'calc(100% + 6px)' } : {}) }}>
                    {visible.map(a => (
                        <button key={a.label} role="menuitem" className={`popover-item ${a.danger ? 'danger' : ''}`}
                            onClick={() => { setOpen(false); a.onClick(); }}>
                            <i className={`fa-solid ${a.icon}`} /> {a.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
