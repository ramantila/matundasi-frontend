import dayjs from 'dayjs';
import { isBlank } from './format';

// Form state keeps strings for inputs (booleans stay booleans, multi-selects are
// arrays of id strings) so inputs stay controlled.
const blankValue = (f) => f.type === 'boolean' ? false : f.type === 'multirelation' ? [] : '';

export function emptyValues(fields) {
    return Object.fromEntries(fields.map(f => [f.name, (typeof f.default === 'function' ? f.default() : f.default) ?? blankValue(f)]));
}

export function toFormValues(fields, record) {
    return Object.fromEntries(fields.map(f => {
        const v = record?.[f.name];
        if (f.type === 'boolean') return [f.name, !!v];
        if (f.type === 'multirelation') return [f.name, Array.isArray(v) ? v.map(String) : []];
        if (f.type === 'password') return [f.name, ''];   // never echoed back by the API
        return [f.name, isBlank(v) ? '' : String(v)];
    }));
}

// Fields shown in the create or the edit form (createOnly fields, e.g. a password, are create-only).
export const formFields = (fields, isEdit) => isEdit ? fields.filter(f => !f.createOnly) : fields;

// Converts form state into the JSON body the Spring request records expect.
export function toPayload(fields, values) {
    return Object.fromEntries(fields.map(f => {
        const v = values[f.name];
        switch (f.type) {
            case 'boolean': return [f.name, !!v];
            case 'integer': return [f.name, isBlank(v) ? null : parseInt(v, 10)];
            case 'decimal': return [f.name, isBlank(v) ? null : Number(v)];
            case 'multirelation': return [f.name, v || []];
            case 'password': return [f.name, isBlank(v) ? null : v];   // sent as typed, spaces included
            default: {
                const t = typeof v === 'string' ? v.trim() : v;
                return [f.name, isBlank(t) ? null : t];
            }
        }
    }));
}

// Client-side mirror of the backend's bean validation + service rules.
export function validate(resource, values) {
    const errors = {};
    for (const f of resource.fields) {
        const raw = values[f.name];
        const blank = f.type === 'multirelation' ? !raw?.length
            : f.type !== 'boolean' && isBlank(typeof raw === 'string' ? raw.trim() : raw);
        if (blank) {
            if (f.required) errors[f.name] = `${f.label} is required`;
            continue;
        }
        if (f.type === 'integer' || f.type === 'decimal') {
            const n = Number(raw);
            if (Number.isNaN(n)) { errors[f.name] = 'Enter a valid number'; continue; }
            if (f.type === 'integer' && !Number.isInteger(n)) { errors[f.name] = 'Enter a whole number'; continue; }
            if (f.min !== undefined && n < f.min) { errors[f.name] = f.max !== undefined ? `Must be between ${f.min} and ${f.max}` : `Must be ${f.min} or greater`; continue; }
            if (f.max !== undefined && n > f.max) { errors[f.name] = `Must be between ${f.min ?? '−∞'} and ${f.max}`; continue; }
            if (f.type === 'decimal' && /\.\d{7,}$/.test(String(raw))) { errors[f.name] = 'At most 6 decimal places'; continue; }
        }
        if (f.maxLength && String(raw).length > f.maxLength) errors[f.name] = `At most ${f.maxLength} characters`;
        if (f.minLength && (f.type === 'password' ? String(raw) : String(raw).trim()).length < f.minLength) errors[f.name] = `At least ${f.minLength} characters`;
        if (f.pattern && !f.pattern.regex.test(String(raw).trim())) errors[f.name] = f.pattern.message;
        if (f.pastOrPresent && dayjs(raw).isAfter(dayjs(), 'day')) errors[f.name] = 'Cannot be in the future';
    }
    if (resource.rules && !Object.keys(errors).length) {
        const payload = toPayload(resource.fields, values);
        for (const rule of resource.rules) Object.assign(errors, rule(payload) || {});
    }
    return errors;
}
