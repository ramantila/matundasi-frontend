import api, { unwrap } from './interceptor';

const BASE = '/api/v1/permissions';

export async function getPermissions() {
    const res = await api.get(BASE);
    return unwrap(res) ?? [];
}

export async function getPermissionById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return unwrap(res);
}

export async function createPermission(payload) {
    const res = await api.post(BASE, payload);
    return unwrap(res);
}

export async function updatePermission(id, payload) {
    const res = await api.put(`${BASE}/${id}`, payload);
    return unwrap(res);
}

export async function deletePermission(id) {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
}
