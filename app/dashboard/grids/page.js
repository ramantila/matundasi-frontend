"use client";
import ResourceListPage from '@/components/ResourceListPage';
import { RESOURCES } from '@/lib/resources';

export default function GridsPage() {
    return <ResourceListPage resource={RESOURCES['grids']} />;
}
