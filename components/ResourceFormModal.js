"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'react-toastify';
import FormField from './FormField';
import useLookups, { lookupRefs } from '@/lib/useLookups';
import { emptyValues, toFormValues, toPayload, validate, formFields } from '@/lib/formValues';
import { isBlank } from '@/lib/format';
import { apiErrorMessage, apiFieldErrors } from '@/services/interceptor';

// Create (no id) or edit (id) a record of `resource` in a modal dialog.
export default function ResourceFormModal({ resource, id, onClose, onSaved }) {
    const isEdit = !!id;
    const { singular } = resource;
    // On edit, createOnly fields (e.g. password) are left out of the form, validation and payload.
    const fields   = useMemo(() => formFields(resource.fields, isEdit), [resource, isEdit]);
    const sections = useMemo(() => resource.sections
        .map(s => ({ ...s, fields: formFields(s.fields, isEdit) }))
        .filter(s => s.fields.length), [resource, isEdit]);

    const [values, setValues]       = useState(() => emptyValues(fields));
    const [initial, setInitial]     = useState(values);
    const [record, setRecord]       = useState(null);
    const [errors, setErrors]       = useState({});
    const [loadingRecord, setLoadingRecord] = useState(isEdit);
    const [loadError, setLoadError] = useState(null);
    const [saving, setSaving]       = useState(false);
    const bodyRef = useRef(null);

    const { lookups, loading: lookupsLoading } = useLookups(lookupRefs(fields));

    useEffect(() => {
        if (!isEdit) return;
        resource.service.get(id)
            .then(rec => { const v = toFormValues(fields, rec); setRecord(rec); setValues(v); setInitial(v); })
            .catch(err => setLoadError(err?.response?.status === 404 ? `This ${singular.toLowerCase()} no longer exists.` : apiErrorMessage(err, `Failed to load ${singular.toLowerCase()}`)))
            .finally(() => setLoadingRecord(false));
    }, [id]);

    const dirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(initial), [values, initial]);
    const missingRequired = fields.some(f => f.required && (Array.isArray(values[f.name]) ? !values[f.name].length : isBlank(typeof values[f.name] === 'string' ? values[f.name].trim() : values[f.name])));

    const requestClose = () => {
        if (!saving) onClose();
    };

    // Lock page scroll; Escape closes unless a dropdown or calendar is open (they handle Escape themselves).
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e) => {
            if (e.key !== 'Escape') return;
            if (document.querySelector('.select-box.open, .react-datepicker-popper')) return;
            requestClose();
        };
        document.addEventListener('keydown', onKey);
        return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
    });

    const setField = (name) => (v) => {
        setValues(prev => ({ ...prev, [name]: v }));
        if (errors[name]) setErrors(prev => { const next = { ...prev }; delete next[name]; return next; });
    };

    const focusFirstError = (errs) => {
        const first = fields.find(f => errs[f.name]);
        const el = first && document.getElementById(`f-${first.name}`);
        if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.focus({ preventScroll: true }); }
    };

    const save = async (addAnother) => {
        const errs = validate({ ...resource, fields }, values);
        setErrors(errs);
        if (Object.keys(errs).length) { focusFirstError(errs); return; }
        setSaving(true);
        try {
            const payload = toPayload(fields, values);
            if (isEdit) await resource.service.update(id, payload);
            else await resource.service.create(payload);
            toast.success(`${singular} ${isEdit ? 'updated' : 'created'} successfully`);
            onSaved?.();
            if (addAnother) {
                const empty = emptyValues(fields);
                setValues(empty); setInitial(empty); setErrors({});
                bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                onClose();
            }
        } catch (err) {
            const fieldErrs = apiFieldErrors(err);
            if (Object.keys(fieldErrs).length) { setErrors(fieldErrs); focusFirstError(fieldErrs); }
            toast.error(apiErrorMessage(err, `Failed to ${isEdit ? 'update' : 'create'} ${singular.toLowerCase()}`));
        } finally {
            setSaving(false);
        }
    };

    const fieldCount = fields.length;
    const size = fieldCount > 8 ? 'lg' : '';
    const multiSection = sections.length > 1;
    const errorCount = Object.keys(errors).length;
    const subtitle = isEdit
        ? (record ? `Update the details of ${resource.label(record)}.` : 'Loading…')
        : `Fill in the details below to add a new ${singular.toLowerCase()}.`;

    let firstFocusable = !isEdit;

    return (
        <div className="modal-root" role="dialog" aria-modal="true" aria-labelledby="fm-title">
            <div className="modal-backdrop" onClick={requestClose} />
            <div className={`modal-panel form-modal ${size}`}>
                <div className="fm-header">
                    <span className="fm-tile"><i className={`fa-solid ${resource.icon}`} /></span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <h3 id="fm-title" className="fm-title">{isEdit ? `Edit ${singular}` : `New ${singular}`}</h3>
                        <p className="fm-subtitle">{subtitle}</p>
                    </div>
                    <button type="button" className="icon-btn" onClick={requestClose} aria-label="Close" disabled={saving}>
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>

                <form id="resource-form" className="fm-body" ref={bodyRef} noValidate onSubmit={e => { e.preventDefault(); save(false); }}>
                    {loadingRecord ? (
                        <div className="table-empty"><i className="fa-solid fa-spinner fa-spin" />Loading {singular.toLowerCase()}…</div>
                    ) : loadError ? (
                        <div className="table-empty error"><i className="fa-solid fa-circle-exclamation" />{loadError}</div>
                    ) : sections.map(section => (
                        <section key={section.title} className="fm-section">
                            {multiSection && (
                                <div className="fm-section-title">
                                    <i className={`fa-solid ${section.icon}`} />
                                    {section.title}
                                    <span className="fm-section-meta">{section.fields.length} field{section.fields.length === 1 ? '' : 's'}</span>
                                </div>
                            )}
                            <div className={`fm-grid ${size}`}>
                                {section.fields.map(f => {
                                    const autoFocus = firstFocusable && ['text', 'integer', 'decimal', 'textarea', 'password'].includes(f.type);
                                    if (autoFocus) firstFocusable = false;
                                    return (
                                        <FormField key={f.name} field={f} value={values[f.name]} onChange={setField(f.name)} autoFocus={autoFocus}
                                            error={errors[f.name]} disabled={saving} lookups={lookups} lookupsLoading={lookupsLoading} />
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </form>

                <div className="fm-footer">
                    {errorCount > 0 && (
                        <span className="fm-error-summary"><i className="fa-solid fa-circle-exclamation" /> Fix {errorCount} field{errorCount === 1 ? '' : 's'} to continue</span>
                    )}
                    <button type="button" className="btn-outline-primary" onClick={requestClose} disabled={saving}>Cancel</button>
                    {!isEdit && (
                        <button type="button" className="btn-outline-primary" onClick={() => save(true)} disabled={saving || missingRequired}>
                            Save &amp; add another
                        </button>
                    )}
                    <button type="submit" form="resource-form" className="btn-primary" disabled={saving || missingRequired || loadingRecord || !!loadError || (isEdit && !dirty)}>
                        {saving
                            ? <><i className="fa-solid fa-spinner fa-spin" /> Saving…</>
                            : isEdit
                                ? <><i className="fa-solid fa-floppy-disk" /> Save Changes</>
                                : <><i className="fa-solid fa-plus" /> Create {singular}</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
