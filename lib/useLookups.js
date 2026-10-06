"use client";
import { useState, useEffect } from 'react';
import { RESOURCES } from './resources';

// The resources a set of fields points at (single and multi foreign keys).
export const lookupRefs = (fields) => fields.filter(f => f.type === 'relation' || f.type === 'multirelation').map(f => f.ref);

// Loads the referenced resources (foreign keys) once and exposes them as
// { [slug]: { options: [{ value, label }], map: Map<id, label> } }.
// A resource can narrow what it offers as an option with `lookup` (e.g. only active roles).
export default function useLookups(refs) {
    const key = [...new Set(refs)].sort().join(',');
    const [lookups, setLookups] = useState({});
    const [loading, setLoading] = useState(!!key);

    useEffect(() => {
        if (!key) { setLoading(false); return; }
        let cancelled = false;
        const slugs = key.split(',');
        setLoading(true);
        Promise.allSettled(slugs.map(slug => (RESOURCES[slug].lookup ?? RESOURCES[slug].service.list)()))
            .then(results => {
                if (cancelled) return;
                const next = {};
                results.forEach((res, i) => {
                    const ref = RESOURCES[slugs[i]];
                    const rows = res.status === 'fulfilled' ? res.value : [];
                    const options = rows.map(r => ({ value: String(r.id), label: ref.label(r) }))
                        .sort((a, b) => String(a.label).localeCompare(String(b.label), undefined, { numeric: true }));
                    next[slugs[i]] = { options, map: new Map(options.map(o => [o.value, o.label])), failed: res.status === 'rejected' };
                });
                setLookups(next);
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [key]);

    return { lookups, loading };
}
