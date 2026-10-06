import api, { unwrap } from './interceptor';

const BASE = '/api/v1/rocks';

export async function getRocks() {
    const res = await api.get(BASE);
    return unwrap(res) ?? [];
}

export async function getRockById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return unwrap(res);
}

export async function createRock(payload) {
    const res = await api.post(BASE, payload);
    return unwrap(res);
}

export async function updateRock(id, payload) {
    const res = await api.put(`${BASE}/${id}`, payload);
    return unwrap(res);
}

export async function deleteRock(id) {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
}
