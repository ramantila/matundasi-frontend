"use client";
import ResourceListPage from '@/components/ResourceListPage';
import { RESOURCES } from '@/lib/resources';

export default function PitsPage() {
    return <ResourceListPage resource={RESOURCES['pits']} />;
}
