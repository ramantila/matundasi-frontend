import api, { unwrap } from './interceptor';

const BASE = '/api/v1/drill-surveys';

export async function getDrillSurveys() {
    const res = await api.get(BASE);
    return unwrap(res) ?? [];
}

export async function getDrillSurveyById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return unwrap(res);
}

export async function createDrillSurvey(payload) {
    const res = await api.post(BASE, payload);
    return unwrap(res);
}

export async function updateDrillSurvey(id, payload) {
    const res = await api.put(`${BASE}/${id}`, payload);
    return unwrap(res);
}

export async function deleteDrillSurvey(id) {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
}
