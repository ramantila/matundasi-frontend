import api, { unwrap } from './interceptor';

const BASE = '/api/v1/rab-collars';

export async function getRabCollars() {
    const res = await api.get(BASE);
    return unwrap(res) ?? [];
}

export async function getRabCollarById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return unwrap(res);
}

export async function createRabCollar(payload) {
    const res = await api.post(BASE, payload);
    return unwrap(res);
}

export async function updateRabCollar(id, payload) {
    const res = await api.put(`${BASE}/${id}`, payload);
    return unwrap(res);
}

export async function deleteRabCollar(id) {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
}
