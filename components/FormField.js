"use client";
import React from 'react';
import DateField from './DateField';
import SelectField from './SelectField';
import ChecklistField from './ChecklistField';
import { isBlank } from '@/lib/format';

// Leading icon inside the outlined input; a field can override it with `icon`.
function iconFor(field) {
    if (field.icon) return field.icon;
    if (field.suffix === '%') return 'fa-solid fa-percent';
    if (field.suffix === '°') return 'fa-regular fa-compass';
    if (field.prefix === 'USD') return 'fa-solid fa-dollar-sign';
    switch (field.type) {
        case 'textarea': return 'fa-solid fa-align-left';
        case 'integer':  return 'fa-solid fa-hashtag';
        case 'decimal':  return field.suffix === 'm' ? 'fa-solid fa-ruler-vertical' : 'fa-solid fa-calculator';
        case 'date':     return 'fa-regular fa-calendar';
        case 'select':   return 'fa-solid fa-list-ul';
        case 'relation': return 'fa-solid fa-link';
        case 'password': return 'fa-solid fa-lock';
        default:         return 'fa-regular fa-id-card';
    }
}

// Material-style outlined field: leading icon, label that floats onto the border.
export default function FormField({ field, value, onChange, error, disabled, lookups, lookupsLoading, autoFocus }) {
    const id = `f-${field.name}`;
    const invalid = !!error;
    const span = field.span === 'full' ? 'span-full' : field.span === 2 ? 'span-2' : '';
    const unit = field.suffix === 'm' ? ' (m)' : '';
    const label = <>{field.label}{unit}{field.required && <span className="req">*</span>}</>;

    if (field.type === 'boolean') {
        return (
            <div className={`form-field ${span}`}>
                <label className="mf-switch-box" htmlFor={id}>
                    <i className="mf-icon fa-solid fa-toggle-on" />
                    <span className="mf-switch-label">{field.label}</span>
                    <span className="switch">
                        <input id={id} type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} disabled={disabled} />
                        <span className="track" />
                    </span>
                </label>
            </div>
        );
    }

    if (field.type === 'multirelation') {
        return (
            <div className={`form-field ${span}`}>
                <ChecklistField id={id} label={field.label} required={field.required} value={value} onChange={onChange}
                    options={lookups?.[field.ref]?.options || []} loading={lookupsLoading} disabled={disabled} invalid={invalid}
                    groupBy={field.groupBy} itemLabel={field.itemLabel} />
                {error && <span className="form-error" role="alert">{error}</span>}
            </div>
        );
    }

    const hasUnit = field.suffix === '°' || field.suffix === '%';
    const inputClass = `mf-input ${hasUnit ? 'has-suffix' : ''}`;
    let control;
    switch (field.type) {
        case 'textarea':
            control = <textarea id={id} className={inputClass} value={value} rows={3} autoFocus={autoFocus}
                onChange={e => onChange(e.target.value)} disabled={disabled} placeholder={field.placeholder || ' '} maxLength={field.maxLength} />;
            break;
        case 'integer':
        case 'decimal':
            control = (
                <>
                    <input id={id} type="number" inputMode={field.type === 'integer' ? 'numeric' : 'decimal'} autoFocus={autoFocus}
                        step={field.type === 'integer' ? 1 : 'any'} min={field.min} max={field.max}
                        className={inputClass} value={value} onChange={e => onChange(e.target.value)} onWheel={e => e.currentTarget.blur()}
                        disabled={disabled} placeholder={field.placeholder ?? (field.min !== undefined && field.max !== undefined ? `${field.min} – ${field.max}` : ' ')} />
                    {hasUnit && <span className="mf-suffix">{field.suffix}</span>}
                </>
            );
            break;
        case 'date':
            control = <DateField id={id} label={field.label} value={value} onChange={onChange} disabled={disabled} invalid={invalid}
                inputClassName="mf-input" placeholder="DD/MM/YYYY" maxDate={field.pastOrPresent ? new Date() : undefined} />;
            break;
        case 'select':
            control = <SelectField id={id} value={value} options={field.options} onChange={onChange} disabled={disabled} invalid={invalid}
                className="mf-input" placeholder="" clearable={!field.required} />;
            break;
        case 'relation':
            control = <SelectField id={id} value={value} options={lookups?.[field.ref]?.options || []} onChange={onChange}
                loading={lookupsLoading} disabled={disabled} invalid={invalid}
                className="mf-input" placeholder="" clearable={!field.required} />;
            break;
        case 'password':
            control = <input id={id} type="password" className={inputClass} value={value} autoFocus={autoFocus} autoComplete="new-password"
                onChange={e => onChange(e.target.value)} disabled={disabled} placeholder={field.placeholder || ' '} maxLength={field.maxLength} />;
            break;
        default:
            control = <input id={id} type="text" className={inputClass} value={value} autoFocus={autoFocus}
                onChange={e => onChange(e.target.value)} disabled={disabled} placeholder={field.placeholder || ' '} maxLength={field.maxLength} />;
    }

    const filled = !isBlank(value) || (field.type === 'relation' && lookupsLoading);

    return (
        <div className={`form-field ${span}`}>
            <div className={`mf ${filled ? 'filled' : ''} ${invalid ? 'invalid' : ''} ${disabled ? 'disabled' : ''} ${field.type === 'textarea' ? 'multiline' : ''}`}>
                <i className={`mf-icon ${iconFor(field)}`} />
                {control}
                <label className="mf-label" htmlFor={id}>{label}</label>
            </div>
            {error && <span className="form-error" role="alert">{error}</span>}
        </div>
    );
}
