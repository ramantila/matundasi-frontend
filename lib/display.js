import { isBlank, formatDate, formatNumber, formatMoney } from './format';

export const shortId = (id) => (id ? `${String(id).slice(0, 8)}…` : '—');

export function relationLabel(lookups, ref, id) {
    if (isBlank(id)) return '—';
    return lookups?.[ref]?.map.get(String(id)) ?? shortId(id);
}

const relationLabels = (lookups, ref, ids) => ids.map(id => relationLabel(lookups, ref, id)).join(', ');

// Read-only rendering of a form field's value (detail modal, exports).
export function displayValue(field, value, lookups) {
    if (isBlank(value) || (Array.isArray(value) && !value.length)) return '—';
    if (Array.isArray(value) && field.type !== 'multirelation') return value.join(', ');
    switch (field.type) {
        case 'relation': return relationLabel(lookups, field.ref, value);
        case 'multirelation': return relationLabels(lookups, field.ref, value);
        case 'boolean':  return value ? 'Yes' : 'No';
        case 'date':     return formatDate(value);
        case 'select':   return field.options?.find(o => o.value === value)?.label ?? String(value);
        case 'integer':
        case 'decimal':
            if (field.prefix === 'USD') return formatMoney(value);
            return `${formatNumber(value)}${field.suffix ? ` ${field.suffix}` : ''}`;
        default:         return String(value);
    }
}

// Plain value for a list column (Excel/PDF export and search).
export function columnText(col, row, lookups) {
    const v = row[col.key];
    if (isBlank(v)) return '';
    switch (col.format) {
        case 'relation': return relationLabel(lookups, col.ref, v);
        case 'date':     return formatDate(v);
        case 'bool':     return v ? 'Yes' : 'No';
        default:         return v;
    }
}

// Raw value for spreadsheet export: numbers stay numeric, foreign keys become labels.
export function exportValue(field, value, lookups) {
    if (isBlank(value)) return '';
    switch (field.type) {
        case 'relation': return relationLabel(lookups, field.ref, value);
        case 'multirelation': return relationLabels(lookups, field.ref, value || []);
        case 'boolean':  return value ? 'Yes' : 'No';
        case 'select':   return field.options?.find(o => o.value === value)?.label ?? value;
        case 'integer':
        case 'decimal':  return Number(value);
        default:         return value;
    }
}
