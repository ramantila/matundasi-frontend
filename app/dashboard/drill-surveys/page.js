"use client";
import ResourceListPage from '@/components/ResourceListPage';
import { RESOURCES } from '@/lib/resources';

export default function DrillSurveysPage() {
    return <ResourceListPage resource={RESOURCES['drill-surveys']} />;
}
