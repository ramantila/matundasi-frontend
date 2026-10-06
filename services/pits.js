import api, { unwrap } from './interceptor';

const BASE = '/api/v1/pits';

export async function getPits() {
    const res = await api.get(BASE);
    return unwrap(res) ?? [];
}

export async function getPitById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return unwrap(res);
}

export async function createPit(payload) {
    const res = await api.post(BASE, payload);
    return unwrap(res);
}

export async function updatePit(id, payload) {
    const res = await api.put(`${BASE}/${id}`, payload);
    return unwrap(res);
}

export async function deletePit(id) {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
}
