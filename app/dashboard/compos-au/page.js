"use client";
import ResourceListPage from '@/components/ResourceListPage';
import { RESOURCES } from '@/lib/resources';

export default function AuCompositesPage() {
    return <ResourceListPage resource={RESOURCES['compos-au']} />;
}
