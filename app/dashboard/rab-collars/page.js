"use client";
import ResourceListPage from '@/components/ResourceListPage';
import { RESOURCES } from '@/lib/resources';

export default function RabCollarsPage() {
    return <ResourceListPage resource={RESOURCES['rab-collars']} />;
}
