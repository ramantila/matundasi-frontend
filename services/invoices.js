import api, { unwrap } from './interceptor';

const BASE = '/api/v1/invoices';

export async function getInvoices() {
    const res = await api.get(BASE);
    return unwrap(res) ?? [];
}

export async function getInvoiceById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return unwrap(res);
}

export async function createInvoice(payload) {
    const res = await api.post(BASE, payload);
    return unwrap(res);
}

export async function updateInvoice(id, payload) {
    const res = await api.put(`${BASE}/${id}`, payload);
    return unwrap(res);
}

export async function deleteInvoice(id) {
    const res = await api.delete(`${BASE}/${id}`);
    return res.data;
}
