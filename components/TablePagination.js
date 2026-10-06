export const PAGE_SIZES = [10, 25, 50, 100];

export default function TablePagination({ page, pageSize, total, onPage, onPageSize }) {
    const lastPage = Math.max(1, Math.ceil(total / pageSize));
    const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const end   = Math.min(page * pageSize, total);

    return (
        <div className="table-pagination">
            <div className="per-page">
                <span>Items per page:</span>
                <div className="select-outline compact">
                    <select value={pageSize} onChange={e => onPageSize(Number(e.target.value))} aria-label="Items per page">
                        {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>
            <span className="range">{start} – {end} of {total}</span>
            <div className="pager">
                <button onClick={() => onPage(1)} disabled={page <= 1} aria-label="First page"><i className="fa-solid fa-backward-step" /></button>
                <button onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page"><i className="fa-solid fa-chevron-left" /></button>
                <button onClick={() => onPage(page + 1)} disabled={page >= lastPage} aria-label="Next page"><i className="fa-solid fa-chevron-right" /></button>
                <button onClick={() => onPage(lastPage)} disabled={page >= lastPage} aria-label="Last page"><i className="fa-solid fa-forward-step" /></button>
            </div>
        </div>
    );
}
