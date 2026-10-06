import api, { unwrap } from './interceptor';

const BASE = '/api/v1/users';

export async function getUsers() {
    const res = await api.get(BASE);
    return unwrap(res) ?? [];
}

export async function getUserById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return unwrap(res);
}

export async function createUser(payload) {
    const res = await api.post(BASE, payload);
    return unwrap(res);
}

export async function updateUser(id, payload) {
    const res = await api.put(`${BASE}/${id}`, payload);
    return unwrap(res);
}

export async function deleteUser(id) {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
}

// Admin reset — no current-password check.
export async function changeUserPassword(id, newPassword) {
    const res = await api.patch(`${BASE}/${id}/change-password`, { newPassword });
    return res.data;
}
