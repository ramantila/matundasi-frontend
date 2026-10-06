import api, { unwrap } from './interceptor';

const BASE = '/api/v1/branches';

export async function getBranches() {
    const res = await api.get(BASE);
    return unwrap(res) ?? [];
}

export async function getBranchById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return unwrap(res);
}

export async function createBranch(payload) {
    const res = await api.post(BASE, payload);
    return unwrap(res);
}

export async function updateBranch(id, payload) {
    const res = await api.put(`${BASE}/${id}`, payload);
    return unwrap(res);
}

export async function deleteBranch(id) {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
}
