'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/search', label: 'Search', icon: 'search' },
  { href: '/library', label: 'Your Library', icon: 'library' },
];

const EXTRA_NAV = [
  { href: '/mood', label: 'Mood Mix', icon: 'mood' },
  { href: '/podcasts', label: 'Podcasts', icon: 'podcast' },
  { href: '/karaoke', label: 'Karaoke', icon: 'karaoke' },
  { href: '/stats', label: 'Stats', icon: 'stats' },
  { href: '/social', label: 'Social', icon: 'social' },
  { href: '/lyrics', label: 'Lyrics', icon: 'lyrics' },
];

function NavIcon({ type, size = 22 }) {
  const icons = {
    home: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3L4 9v12h5v-7h6v7h5V9l-8-6z"/>
      </svg>
    ),
    search: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7"/>
        <path d="M21 21l-4.35-4.35"/>
      </svg>
    ),
    library: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 4h2v16H4V4zm4 0h2v16H8V4zm4 2l8 6-8 6V6z"/>
      </svg>
    ),
    mood: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    ),
    podcast: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1a9 9 0 00-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2a7 7 0 0114 0v2h-4v8h3c1.66 0 3-1.34 3-3v-7a9 9 0 00-9-9z"/>
      </svg>
    ),
    karaoke: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z"/>
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
      </svg>
    ),
    stats: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
      </svg>
    ),
    social: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
      </svg>
    ),
    lyrics: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3v10.55A4 4 0 1014 17V7h4V3h-6z"/>
      </svg>
    ),
    add: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
      </svg>
    ),
  };
  return icons[type] || null;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32">
                <stop offset="0%" stopColor="#1DB954"/>
                <stop offset="100%" stopColor="#7c3aed"/>
              </linearGradient>
            </defs>
            <circle cx="16" cy="16" r="16" fill="url(#logoGrad)"/>
            <path d="M10 20c4-2 8-2 12 0" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M8 16c5.33-3.2 10.67-3.2 16 0" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M6 12c6.67-4 13.33-4 20 0" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
          </svg>
        </div>
        {!collapsed && <span className="sidebar__logo-text">Sonicwave</span>}
      </div>

      <nav className="sidebar__nav">
        <div className="sidebar__section">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar__link ${pathname === item.href ? 'sidebar__link--active' : ''}`}
            >
              <NavIcon type={item.icon} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </div>

        <div className="sidebar__divider" />

        <div className="sidebar__section">
          <div className="sidebar__section-title">
            {!collapsed && 'Explore'}
          </div>
          {EXTRA_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar__link ${pathname === item.href ? 'sidebar__link--active' : ''}`}
            >
              <NavIcon type={item.icon} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </div>
      </nav>

      <button
        className="sidebar__collapse-btn"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"
          style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}>
          <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
        </svg>
      </button>
    </aside>
  );
}
