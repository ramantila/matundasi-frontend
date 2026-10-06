import api, { unwrap } from './interceptor';

const BASE = '/api/v1/sizes';

export async function getSizes() {
    const res = await api.get(BASE);
    return unwrap(res) ?? [];
}

export async function getSizeById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return unwrap(res);
}

export async function createSize(payload) {
    const res = await api.post(BASE, payload);
    return unwrap(res);
}

export async function updateSize(id, payload) {
    const res = await api.put(`${BASE}/${id}`, payload);
    return unwrap(res);
}

export async function deleteSize(id) {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
}
