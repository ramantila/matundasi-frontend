import api, { unwrap } from './interceptor';

const BASE = '/api/v1/elements';

export async function getElements() {
    const res = await api.get(BASE);
    return unwrap(res) ?? [];
}

export async function getElementById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return unwrap(res);
}

export async function createElement(payload) {
    const res = await api.post(BASE, payload);
    return unwrap(res);
}

export async function updateElement(id, payload) {
    const res = await api.put(`${BASE}/${id}`, payload);
    return unwrap(res);
}

export async function deleteElement(id) {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
}
