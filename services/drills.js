import api, { unwrap } from './interceptor';

const BASE = '/api/v1/drills';

export async function getDrills() {
    const res = await api.get(BASE);
    return unwrap(res) ?? [];
}

export async function getDrillById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return unwrap(res);
}

export async function createDrill(payload) {
    const res = await api.post(BASE, payload);
    return unwrap(res);
}

export async function updateDrill(id, payload) {
    const res = await api.put(`${BASE}/${id}`, payload);
    return unwrap(res);
}

export async function deleteDrill(id) {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
}
