"use client";
import ResourceListPage from '@/components/ResourceListPage';
import { RESOURCES } from '@/lib/resources';

export default function InvoicesPage() {
    return <ResourceListPage resource={RESOURCES['invoices']} />;
}
