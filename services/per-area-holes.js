import api, { unwrap } from './interceptor';

const BASE = '/api/v1/per-area-holes';

export async function getPerAreaHoles() {
    const res = await api.get(BASE);
    return unwrap(res) ?? [];
}

export async function getPerAreaHoleById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return unwrap(res);
}

export async function createPerAreaHole(payload) {
    const res = await api.post(BASE, payload);
    return unwrap(res);
}

export async function updatePerAreaHole(id, payload) {
    const res = await api.put(`${BASE}/${id}`, payload);
    return unwrap(res);
}

export async function deletePerAreaHole(id) {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
}
