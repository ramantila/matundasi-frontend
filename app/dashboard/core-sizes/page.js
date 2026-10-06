"use client";
import ResourceListPage from '@/components/ResourceListPage';
import { RESOURCES } from '@/lib/resources';

export default function CoreSizesPage() {
    return <ResourceListPage resource={RESOURCES['core-sizes']} />;
}
