import api, { unwrap } from './interceptor';

const BASE = '/api/v1/core-sizes';

export async function getCoreSizes() {
    const res = await api.get(BASE);
    return unwrap(res) ?? [];
}

export async function getCoreSizeById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return unwrap(res);
}

export async function createCoreSize(payload) {
    const res = await api.post(BASE, payload);
    return unwrap(res);
}

export async function updateCoreSize(id, payload) {
    const res = await api.put(`${BASE}/${id}`, payload);
    return unwrap(res);
}

export async function deleteCoreSize(id) {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
}
