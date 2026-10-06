import api, { unwrap } from './interceptor';

const BASE = '/api/v1/roles';

// activeOnly leaves out deactivated roles (for the user form's role picker).
export async function getRoles({ activeOnly = false } = {}) {
    const res = await api.get(BASE, { params: activeOnly ? { activeOnly: true } : undefined });
    return unwrap(res) ?? [];
}

export async function getRoleById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return unwrap(res);
}

export async function createRole(payload) {
    const res = await api.post(BASE, payload);
    return unwrap(res);
}

export async function updateRole(id, payload) {
    const res = await api.put(`${BASE}/${id}`, payload);
    return unwrap(res);
}

export async function deleteRole(id) {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
}
