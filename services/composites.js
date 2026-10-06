import api, { unwrap } from './interceptor';

const BASE = '/api/v1/composites';

export async function getComposites() {
    const res = await api.get(BASE);
    return unwrap(res) ?? [];
}

export async function getCompositeById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return unwrap(res);
}

export async function createComposite(payload) {
    const res = await api.post(BASE, payload);
    return unwrap(res);
}

export async function updateComposite(id, payload) {
    const res = await api.put(`${BASE}/${id}`, payload);
    return unwrap(res);
}

export async function deleteComposite(id) {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
}
