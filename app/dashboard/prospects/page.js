"use client";
import ResourceListPage from '@/components/ResourceListPage';
import { RESOURCES } from '@/lib/resources';

export default function ProspectsPage() {
    return <ResourceListPage resource={RESOURCES['prospects']} />;
}
