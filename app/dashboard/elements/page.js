"use client";
import ResourceListPage from '@/components/ResourceListPage';
import { RESOURCES } from '@/lib/resources';

export default function ElementsPage() {
    return <ResourceListPage resource={RESOURCES['elements']} />;
}
