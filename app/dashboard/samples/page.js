"use client";
import ResourceListPage from '@/components/ResourceListPage';
import { RESOURCES } from '@/lib/resources';

export default function SamplesPage() {
    return <ResourceListPage resource={RESOURCES['samples']} />;
}
