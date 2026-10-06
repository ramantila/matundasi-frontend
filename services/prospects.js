import api, { unwrap } from './interceptor';

const BASE = '/api/v1/prospects';

export async function getProspects() {
    const res = await api.get(BASE);
    return unwrap(res) ?? [];
}

export async function getProspectById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return unwrap(res);
}

export async function createProspect(payload) {
    const res = await api.post(BASE, payload);
    return unwrap(res);
}

export async function updateProspect(id, payload) {
    const res = await api.put(`${BASE}/${id}`, payload);
    return unwrap(res);
}

export async function deleteProspect(id) {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
}
