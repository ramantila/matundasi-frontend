"use client";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import FormField from './FormField';
import { changeUserPassword } from '@/services/users';
import { apiErrorMessage, apiFieldErrors } from '@/services/interceptor';

const MIN_LENGTH = 8;   // UserRequest / ChangePasswordRequest: @Size(min = 8)

const FIELDS = [
    { name: 'newPassword', label: 'New password', type: 'password', required: true },
    { name: 'confirm', label: 'Confirm new password', type: 'password', required: true },
];

// Admin reset of a user's password (PATCH /users/{id}/change-password) — no current password needed.
export default function ChangePasswordModal({ resource, row, onClose }) {
    const [values, setValues] = useState({ newPassword: '', confirm: '' });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape' && !saving) onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [saving]);

    const set = (name) => (v) => {
        setValues(prev => ({ ...prev, [name]: v }));
        setErrors(prev => ({ ...prev, [name]: undefined }));
    };

    const save = async (e) => {
        e.preventDefault();
        const errs = {};
        if (values.newPassword.length < MIN_LENGTH) errs.newPassword = `At least ${MIN_LENGTH} characters`;
        if (values.confirm !== values.newPassword) errs.confirm = 'Passwords do not match';
        setErrors(errs);
        if (Object.keys(errs).length) return;
        setSaving(true);
        try {
            await changeUserPassword(row.id, values.newPassword);
            toast.success(`Password reset for ${row.username}`);
            onClose();
        } catch (err) {
            setErrors(apiFieldErrors(err));
            toast.error(apiErrorMessage(err, 'Failed to reset password'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-root" role="dialog" aria-modal="true" aria-labelledby="pw-title">
            <div className="modal-backdrop" onClick={() => !saving && onClose()} />
            <div className="modal-panel form-modal">
                <div className="fm-header">
                    <span className="fm-tile"><i className="fa-solid fa-key" /></span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <h3 id="pw-title" className="fm-title">Reset password</h3>
                        <p className="fm-subtitle">Set a new password for {resource.label(row)} ({row.username}).</p>
                    </div>
                    <button type="button" className="icon-btn" onClick={onClose} aria-label="Close" disabled={saving}>
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>
                <form id="pw-form" className="fm-body" noValidate onSubmit={save}>
                    <div className="fm-grid">
                        {FIELDS.map((f, i) => (
                            <FormField key={f.name} field={f} value={values[f.name]} onChange={set(f.name)}
                                error={errors[f.name]} disabled={saving} autoFocus={i === 0} />
                        ))}
                    </div>
                </form>
                <div className="fm-footer">
                    <button type="button" className="btn-outline-primary" onClick={onClose} disabled={saving}>Cancel</button>
                    <button type="submit" form="pw-form" className="btn-primary" disabled={saving || !values.newPassword || !values.confirm}>
                        {saving ? <><i className="fa-solid fa-spinner fa-spin" /> Saving…</> : <><i className="fa-solid fa-key" /> Reset password</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
