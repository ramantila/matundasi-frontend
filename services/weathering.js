import api, { unwrap } from './interceptor';

const BASE = '/api/v1/weathering';

export async function getWeatherings() {
    const res = await api.get(BASE);
    return unwrap(res) ?? [];
}

export async function getWeatheringById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return unwrap(res);
}

export async function createWeathering(payload) {
    const res = await api.post(BASE, payload);
    return unwrap(res);
}

export async function updateWeathering(id, payload) {
    const res = await api.put(`${BASE}/${id}`, payload);
    return unwrap(res);
}

export async function deleteWeathering(id) {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
}
