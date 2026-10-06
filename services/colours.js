import api, { unwrap } from './interceptor';

const BASE = '/api/v1/colours';

export async function getColours() {
    const res = await api.get(BASE);
    return unwrap(res) ?? [];
}

export async function getColourById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return unwrap(res);
}

export async function createColour(payload) {
    const res = await api.post(BASE, payload);
    return unwrap(res);
}

export async function updateColour(id, payload) {
    const res = await api.put(`${BASE}/${id}`, payload);
    return unwrap(res);
}

export async function deleteColour(id) {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
}
