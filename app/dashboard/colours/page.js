"use client";
import ResourceListPage from '@/components/ResourceListPage';
import { RESOURCES } from '@/lib/resources';

export default function ColoursPage() {
    return <ResourceListPage resource={RESOURCES['colours']} />;
}
