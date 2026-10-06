import api, { unwrap } from './interceptor';

const BASE = '/api/v1/qualifiers';

export async function getQualifiers() {
    const res = await api.get(BASE);
    return unwrap(res) ?? [];
}

export async function getQualifierById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return unwrap(res);
}

export async function createQualifier(payload) {
    const res = await api.post(BASE, payload);
    return unwrap(res);
}

export async function updateQualifier(id, payload) {
    const res = await api.put(`${BASE}/${id}`, payload);
    return unwrap(res);
}

export async function deleteQualifier(id) {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
}
