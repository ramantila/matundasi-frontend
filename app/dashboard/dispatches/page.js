"use client";
import ResourceListPage from '@/components/ResourceListPage';
import { RESOURCES } from '@/lib/resources';

export default function DispatchesPage() {
    return <ResourceListPage resource={RESOURCES['dispatches']} />;
}
