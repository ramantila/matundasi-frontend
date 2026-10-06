"use client";
import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getSession, AUTH_ENABLED } from '@/lib/session';

const MOBILE_QUERY = '(max-width: 992px)';

export default function DashboardLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);   // mobile drawer
    const [collapsed, setCollapsed]     = useState(false);   // desktop hide
    const [authorized, setAuthorized]   = useState(false);
    const pathname = usePathname();
    const router   = useRouter();

    useEffect(() => {
        if (!AUTH_ENABLED) { setAuthorized(true); return; }
        const session = getSession();
        if (!session) { router.replace('/login'); return; }
        setAuthorized(true);
        // Expired access tokens are refreshed on the next request; this only catches the
        // session ending for good (refresh token expired, or another tab signed out).
        const timer = setInterval(() => { if (!getSession()) window.location.href = '/login?reason=expired'; }, 60_000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => { setSidebarOpen(false); }, [pathname]);

    const toggleSidebar = () => {
        if (window.matchMedia(MOBILE_QUERY).matches) setSidebarOpen(v => !v);
        else setCollapsed(v => !v);
    };

    if (!authorized) return (
        <div className="full-center"><i className="fa-solid fa-spinner fa-spin spin-lg" /></div>
    );

    return (
        <div className={`layout ${sidebarOpen ? 'sidebar-open' : ''} ${collapsed ? 'sidebar-collapsed' : ''}`}>
            <Sidebar onClose={() => setSidebarOpen(false)} />
            <div className="content-wrapper">
                <Navbar onToggleSidebar={toggleSidebar} />
                <main className="main-content">{children}</main>
                <Footer />
            </div>
            <ToastContainer position="top-right" autoClose={3000} newestOnTop />
        </div>
    );
}
