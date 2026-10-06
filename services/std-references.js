import api, { unwrap } from './interceptor';

const BASE = '/api/v1/std-references';

export async function getStdReferences() {
    const res = await api.get(BASE);
    return unwrap(res) ?? [];
}

export async function getStdReferenceById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return unwrap(res);
}

export async function createStdReference(payload) {
    const res = await api.post(BASE, payload);
    return unwrap(res);
}

export async function updateStdReference(id, payload) {
    const res = await api.put(`${BASE}/${id}`, payload);
    return unwrap(res);
}

export async function deleteStdReference(id) {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
}
