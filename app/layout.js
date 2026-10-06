import './globals.css';

export const metadata = {
    title: 'Matundasi Portal',
    description: 'Mineral exploration data management — Matundasi project',
    icons: {
        icon: '/favicon.svg',
    },
};

// Applies the saved (or OS) theme before first paint so dark mode doesn't flash.
const themeScript = `
try {
    var t = localStorage.getItem('matundasiTheme');
    if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
} catch (e) {}
`;

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            <script dangerouslySetInnerHTML={{ __html: themeScript }} />
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link
                href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap"
                rel="stylesheet"
            />
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
        </head>
        <body>
            {children}
        </body>
        </html>
    );
}
