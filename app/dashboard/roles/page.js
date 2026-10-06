"use client";
import ResourceListPage from '@/components/ResourceListPage';
import { RESOURCES } from '@/lib/resources';

export default function RolesPage() {
    return <ResourceListPage resource={RESOURCES['roles']} />;
}
