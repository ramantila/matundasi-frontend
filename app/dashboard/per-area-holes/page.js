"use client";
import ResourceListPage from '@/components/ResourceListPage';
import { RESOURCES } from '@/lib/resources';

export default function PerAreaHolesPage() {
    return <ResourceListPage resource={RESOURCES['per-area-holes']} />;
}
