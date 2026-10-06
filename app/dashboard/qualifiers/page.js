"use client";
import ResourceListPage from '@/components/ResourceListPage';
import { RESOURCES } from '@/lib/resources';

export default function QualifiersPage() {
    return <ResourceListPage resource={RESOURCES['qualifiers']} />;
}
