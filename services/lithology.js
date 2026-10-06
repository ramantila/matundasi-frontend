import api, { unwrap } from './interceptor';

const BASE = '/api/v1/lithology';

export async function getLithologies() {
    const res = await api.get(BASE);
    return unwrap(res) ?? [];
}

export async function getLithologyById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return unwrap(res);
}

export async function createLithology(payload) {
    const res = await api.post(BASE, payload);
    return unwrap(res);
}

export async function updateLithology(id, payload) {
    const res = await api.put(`${BASE}/${id}`, payload);
    return unwrap(res);
}

export async function deleteLithology(id) {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
}
