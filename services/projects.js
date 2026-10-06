import api, { unwrap } from './interceptor';

const BASE = '/api/v1/projects';

export async function getProjects() {
    const res = await api.get(BASE);
    return unwrap(res) ?? [];
}

export async function getProjectById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return unwrap(res);
}

export async function createProject(payload) {
    const res = await api.post(BASE, payload);
    return unwrap(res);
}

export async function updateProject(id, payload) {
    const res = await api.put(`${BASE}/${id}`, payload);
    return unwrap(res);
}

export async function deleteProject(id) {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
}
