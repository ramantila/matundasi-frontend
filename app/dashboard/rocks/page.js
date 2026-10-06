"use client";
import ResourceListPage from '@/components/ResourceListPage';
import { RESOURCES } from '@/lib/resources';

export default function RocksPage() {
    return <ResourceListPage resource={RESOURCES['rocks']} />;
}
