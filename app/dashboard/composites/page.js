"use client";
import ResourceListPage from '@/components/ResourceListPage';
import { RESOURCES } from '@/lib/resources';

export default function CompositesPage() {
    return <ResourceListPage resource={RESOURCES['composites']} />;
}
