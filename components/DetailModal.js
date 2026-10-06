"use client";
import React, { useEffect } from 'react';
import { displayValue } from '@/lib/display';

export default function DetailModal({ resource, row, lookups, onClose, onEdit }) {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    // Show every request field (never passwords) plus response-only computed fields (e.g. composite length).
    // detailExclude hides response fields that only repeat a form field (e.g. branchName next to Branch).
    const fields = resource.fields.filter(f => f.type !== 'password');
    const hidden = new Set(['id', ...(resource.detailExclude || [])]);
    const extra = Object.keys(row).filter(k => !hidden.has(k) && !fields.some(f => f.name === k))
        .map(k => ({ name: k, label: k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()), type: typeof row[k] === 'number' ? 'decimal' : 'text' }));

    return (
        <div className="modal-root" role="dialog" aria-modal="true" aria-labelledby="detail-title">
            <div className="modal-backdrop" onClick={onClose} />
            <div className="modal-panel wide">
                <div className="fm-header">
                    <span className="fm-tile"><i className={`fa-solid ${resource.icon}`} /></span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <h3 id="detail-title" className="fm-title">{resource.label(row)}</h3>
                        <p className="fm-subtitle">{resource.singular} details</p>
                    </div>
                    <button className="icon-btn" onClick={onClose} aria-label="Close"><i className="fa-solid fa-xmark" /></button>
                </div>
                <div className="detail-grid">
                    {[...fields, ...extra].map(f => (
                        <div key={f.name} className="detail-row">
                            <div className="detail-label">{f.label}</div>
                            <div className="detail-value">{displayValue(f, row[f.name], lookups)}</div>
                        </div>
                    ))}
                </div>
                <div className="fm-footer">
                    <button className="btn-outline-primary" onClick={onClose}>Close</button>
                    {onEdit && <button className="btn-primary" onClick={onEdit}><i className="fa-solid fa-pen" /> Edit</button>}
                </div>
            </div>
        </div>
    );
}
