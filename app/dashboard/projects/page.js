"use client";
import ResourceListPage from '@/components/ResourceListPage';
import { RESOURCES } from '@/lib/resources';

export default function ProjectsPage() {
    return <ResourceListPage resource={RESOURCES['projects']} />;
}
