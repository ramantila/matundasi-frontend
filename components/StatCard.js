import { formatCompact, formatMoney } from '@/lib/format';

const display = (value, format) => {
    if (typeof value === 'string') return value;
    if (format === 'money') return Math.abs(value) < 10000 ? formatMoney(value) : `$${formatCompact(value)}`;
    return formatCompact(value);
};

export default function StatCard({ label, value, icon, tone = 'teal', format, loading }) {
    return (
        <div className="card stat-card">
            <span className={`stat-icon tone-${tone}`}><i className={`fa-solid ${icon}`} /></span>
            <div style={{ minWidth: 0 }}>
                <div className="stat-label">{label}</div>
                {loading
                    ? <div className="stat-value loading" />
                    : <div className="stat-value">{display(value, format)}</div>}
            </div>
        </div>
    );
}
