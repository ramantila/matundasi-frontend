import api, { unwrap } from './interceptor';

const BASE = '/api/v1/differences';

export async function getDifferences() {
    const res = await api.get(BASE);
    return unwrap(res) ?? [];
}

export async function getDifferenceById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return unwrap(res);
}

export async function createDifference(payload) {
    const res = await api.post(BASE, payload);
    return unwrap(res);
}

export async function updateDifference(id, payload) {
    const res = await api.put(`${BASE}/${id}`, payload);
    return unwrap(res);
}

export async function deleteDifference(id) {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
}
