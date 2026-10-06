import { RESOURCE_LIST, RESOURCES, GROUPS } from './resources';

// Modules kept out of the sidebar for now; remove a slug to show it again.
const HIDDEN = [
    'compos-au', // Au Composites
    'drills',    // Drill Assays
    'permissions', // Permissions (seeded by the backend; assigned through Roles)
];

const groupItem = (groupId) => ({
    id: groupId,
    label: GROUPS[groupId].label,
    icon: GROUPS[groupId].icon,
    children: RESOURCE_LIST
        .filter(r => r.group === groupId && !HIDDEN.includes(r.slug))
        .map(r => ({ label: r.title, href: r.href, icon: r.icon, permission: r.permissions.view })),
});

export const NAV = [
    {
        section: 'Overview',
        items: [{ id: 'dashboard', label: 'Dashboard', icon: 'fa-house', href: '/dashboard' }],
    },
    {
        section: 'Operations',
        items: ['exploration', 'drilling', 'assays', 'lab'].map(groupItem),
    },
    {
        section: 'Configurations',
        items: ['lookups', 'admin'].map(groupItem),
    },
];

// /dashboard/<slug>
export function matchRoute(pathname) {
    const [, , slug] = (pathname || '').split('/');
    const resource = RESOURCES[slug];
    return resource ? { resource } : null;
}

export function breadcrumbsFor(pathname) {
    const match = matchRoute(pathname);
    if (!match) return [{ label: 'Home', href: '/dashboard' }, { label: 'Dashboard' }];
    const { resource } = match;
    return [
        { label: 'Home', href: '/dashboard' },
        { label: GROUPS[resource.group].label },
        { label: resource.title },
    ];
}
