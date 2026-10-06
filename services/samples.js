import api, { unwrap } from './interceptor';

const BASE = '/api/v1/samples';

export async function getSamples() {
    const res = await api.get(BASE);
    return unwrap(res) ?? [];
}

export async function getSampleById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return unwrap(res);
}

export async function createSample(payload) {
    const res = await api.post(BASE, payload);
    return unwrap(res);
}

export async function updateSample(id, payload) {
    const res = await api.put(`${BASE}/${id}`, payload);
    return unwrap(res);
}

export async function deleteSample(id) {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
}
