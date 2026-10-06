"use client";
import ResourceListPage from '@/components/ResourceListPage';
import { RESOURCES } from '@/lib/resources';

export default function SchistositiesPage() {
    return <ResourceListPage resource={RESOURCES['schistosity']} />;
}
