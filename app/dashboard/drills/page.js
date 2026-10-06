"use client";
import ResourceListPage from '@/components/ResourceListPage';
import { RESOURCES } from '@/lib/resources';

export default function DrillsPage() {
    return <ResourceListPage resource={RESOURCES['drills']} />;
}
