import api, { unwrap } from './interceptor';

const BASE = '/api/v1/dispatches';

export async function getDispatches() {
    const res = await api.get(BASE);
    return unwrap(res) ?? [];
}

export async function getDispatchById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return unwrap(res);
}

export async function createDispatch(payload) {
    const res = await api.post(BASE, payload);
    return unwrap(res);
}

export async function updateDispatch(id, payload) {
    const res = await api.put(`${BASE}/${id}`, payload);
    return unwrap(res);
}

export async function deleteDispatch(id) {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
}
