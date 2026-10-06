import api, { unwrap } from './interceptor';

const BASE = '/api/v1/grids';

export async function getGrids() {
    const res = await api.get(BASE);
    return unwrap(res) ?? [];
}

export async function getGridById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return unwrap(res);
}

export async function createGrid(payload) {
    const res = await api.post(BASE, payload);
    return unwrap(res);
}

export async function updateGrid(id, payload) {
    const res = await api.put(`${BASE}/${id}`, payload);
    return unwrap(res);
}

export async function deleteGrid(id) {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
}
