import api, { unwrap } from './interceptor';

const BASE = '/api/v1/mw-s';

export async function getMwsHoles() {
    const res = await api.get(BASE);
    return unwrap(res) ?? [];
}

export async function getMwsHoleById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return unwrap(res);
}

export async function createMwsHole(payload) {
    const res = await api.post(BASE, payload);
    return unwrap(res);
}

export async function updateMwsHole(id, payload) {
    const res = await api.put(`${BASE}/${id}`, payload);
    return unwrap(res);
}

export async function deleteMwsHole(id) {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
}
