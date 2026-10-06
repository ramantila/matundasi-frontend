"use client";
import ResourceListPage from '@/components/ResourceListPage';
import { RESOURCES } from '@/lib/resources';

export default function SizesPage() {
    return <ResourceListPage resource={RESOURCES['sizes']} />;
}
