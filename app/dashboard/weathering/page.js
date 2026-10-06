"use client";
import ResourceListPage from '@/components/ResourceListPage';
import { RESOURCES } from '@/lib/resources';

export default function WeatheringsPage() {
    return <ResourceListPage resource={RESOURCES['weathering']} />;
}
