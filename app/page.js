"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, AUTH_ENABLED } from '@/lib/session';

export default function Home() {
    const router = useRouter();
    useEffect(() => {
        router.replace(!AUTH_ENABLED || getSession() ? '/dashboard' : '/login');
    }, []);
    return null;
}
