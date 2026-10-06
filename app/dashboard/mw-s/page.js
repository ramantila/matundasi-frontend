"use client";
import ResourceListPage from '@/components/ResourceListPage';
import { RESOURCES } from '@/lib/resources';

export default function MwsHolesPage() {
    return <ResourceListPage resource={RESOURCES['mw-s']} />;
}
