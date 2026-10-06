"use client";
import ResourceListPage from '@/components/ResourceListPage';
import { RESOURCES } from '@/lib/resources';

export default function BranchesPage() {
    return <ResourceListPage resource={RESOURCES['branches']} />;
}
