import api, { unwrap } from './interceptor';

const BASE = '/api/v1/collars';

export async function getCollars() {
    const res = await api.get(BASE);
    return unwrap(res) ?? [];
}

export async function getCollarById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return unwrap(res);
}

export async function createCollar(payload) {
    const res = await api.post(BASE, payload);
    return unwrap(res);
}

export async function updateCollar(id, payload) {
    const res = await api.put(`${BASE}/${id}`, payload);
    return unwrap(res);
}

export async function deleteCollar(id) {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
}
