"use client";
import React, { useEffect } from 'react';

export default function ConfirmModal({ title, message, confirmLabel = 'Delete', busyLabel = 'Deleting…', icon = 'fa-trash', onConfirm, onCancel, loading }) {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape' && !loading) onCancel(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [loading]);

    return (
        <div className="modal-root" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <div className="modal-backdrop" onClick={() => !loading && onCancel()} />
            <div className="modal-panel">
                <div className="modal-body modal-center">
                    <span className="modal-icon tone-red"><i className={`fa-solid ${icon}`} /></span>
                    <h3 id="confirm-title" className="modal-title">{title}</h3>
                    <p className="modal-text">{message}</p>
                    <div className="modal-actions">
                        <button className="btn-outline" onClick={onCancel} disabled={loading}>Cancel</button>
                        <button className="btn-danger" onClick={onConfirm} disabled={loading}>
                            {loading ? <><i className="fa-solid fa-spinner fa-spin" /> {busyLabel}</> : confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
