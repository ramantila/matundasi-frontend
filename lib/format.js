import dayjs from 'dayjs';

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const plain   = new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 });

export function isBlank(v) {
    return v === null || v === undefined || v === '';
}

// Stat-tile values: 1,284 / 12.9K / 4.2M
export function formatCompact(v) {
    if (isBlank(v) || Number.isNaN(Number(v))) return '—';
    const n = Number(v);
    return Math.abs(n) < 10000 ? plain.format(Number(n.toFixed(2))) : compact.format(n);
}

export function formatNumber(v, maxFraction = 6) {
    if (isBlank(v)) return '—';
    const n = Number(v);
    if (Number.isNaN(n)) return String(v);
    return n.toLocaleString('en-US', { maximumFractionDigits: maxFraction });
}

export function formatDate(v) {
    if (isBlank(v)) return '—';
    const d = dayjs(v);
    return d.isValid() ? d.format('DD MMM YYYY') : String(v);
}

export function formatMoney(v, currency = 'USD') {
    if (isBlank(v)) return '—';
    return Number(v).toLocaleString('en-US', { style: 'currency', currency, maximumFractionDigits: 2 });
}

export const sum   = (rows, key) => rows.reduce((t, r) => t + (Number(r[key]) || 0), 0);
export const avg   = (rows, key) => {
    const vals = rows.map(r => r[key]).filter(v => !isBlank(v)).map(Number);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
};
export const max   = (rows, key) => {
    const vals = rows.map(r => r[key]).filter(v => !isBlank(v)).map(Number);
    return vals.length ? Math.max(...vals) : null;
};
export const countDistinct = (rows, key) => new Set(rows.map(r => r[key]).filter(v => !isBlank(v))).size;
export const countWhere    = (rows, fn) => rows.filter(fn).length;
