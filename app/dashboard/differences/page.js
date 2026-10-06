"use client";
import ResourceListPage from '@/components/ResourceListPage';
import { RESOURCES } from '@/lib/resources';

export default function DifferencesPage() {
    return <ResourceListPage resource={RESOURCES['differences']} />;
}
