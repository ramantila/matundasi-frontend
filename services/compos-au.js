import api, { unwrap } from './interceptor';

const BASE = '/api/v1/compos-au';

export async function getAuComposites() {
    const res = await api.get(BASE);
    return unwrap(res) ?? [];
}

export async function getAuCompositeById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return unwrap(res);
}

export async function createAuComposite(payload) {
    const res = await api.post(BASE, payload);
    return unwrap(res);
}

export async function updateAuComposite(id, payload) {
    const res = await api.put(`${BASE}/${id}`, payload);
    return unwrap(res);
}

export async function deleteAuComposite(id) {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
}
