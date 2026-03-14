import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const pageTitles = {
    '/': 'Invoices',
    '/new': 'New Invoice',
    '/products': 'Products',
    '/categories': 'Categories',
    '/buyers': 'Buyers',
    '/buyers/new': 'Add Buyer',
};

export default function Navbar({ onMenuToggle, onThemeToggle, theme }) {
    const location = useLocation();
    const title = pageTitles[location.pathname] || 'Invoice Detail';

    return (
        <nav className="app-navbar" style={S.nav}>
            <div style={S.left}>
                <button type="button" className="navbar-menu-toggle" style={S.menuBtn} onClick={onMenuToggle}>
                    ☰
                </button>
                <div className="navbar-breadcrumb" style={S.pageCrumb}>
                    <span style={S.crumbRoot}>BillFlow</span>
                    <span style={S.crumbSep}>·</span>
                    <span style={S.crumbCurrent}>{title}</span>
                </div>
            </div>
            <div style={S.right}>
                <button type="button" style={S.themeBtn} onClick={onThemeToggle}>
                    {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </button>
                <Link to="/new" className="navbar-cta" style={S.btnNew}>
                    <span style={S.btnIcon}>+</span>
                    <span className="navbar-cta-label">New Invoice</span>
                </Link>
            </div>
        </nav>
    );
}

const S = {
    nav: {
        height: '64px',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--line-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px',
        position: 'sticky', top: 0, zIndex: 50,
    },
    left: { display: 'flex', alignItems: 'center' },
    menuBtn: {
        display: 'none',
        width: '40px',
        height: '40px',
        marginRight: '12px',
        borderRadius: '10px',
        border: '1px solid var(--line-strong)',
        background: 'var(--gold-dim)',
        color: 'var(--gold)',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1rem',
        flexShrink: 0,
    },
    pageCrumb: { display: 'flex', alignItems: 'center', gap: '8px' },
    crumbRoot: {
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '0.85rem', color: 'color-mix(in srgb, var(--gold) 55%, transparent)',
        fontWeight: 400, letterSpacing: '0.3px',
    },
    crumbSep: { color: 'color-mix(in srgb, var(--gold) 25%, transparent)', fontSize: '0.8rem' },
    crumbCurrent: {
        fontSize: '0.85rem', fontWeight: 500,
        color: 'var(--text-primary)', letterSpacing: '0.2px',
    },
    right: { display: 'flex', alignItems: 'center', gap: '14px' },
    themeBtn: {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: '8px 14px',
        background: 'var(--field-bg)',
        border: '1px solid var(--field-border)',
        color: 'var(--text-secondary)',
        borderRadius: '8px',
        fontWeight: 500, fontSize: '0.78rem',
        letterSpacing: '0.3px',
    },
    btnNew: {
        display: 'inline-flex', alignItems: 'center', gap: '7px',
        background: 'var(--accent-button-bg)',
        border: '1px solid var(--accent-button-border)',
        color: 'var(--gold)',
        padding: '8px 18px',
        borderRadius: '8px',
        fontWeight: 500, fontSize: '0.8rem',
        letterSpacing: '0.3px',
        transition: 'all 0.2s',
        boxShadow: 'var(--shadow-gold)',
    },
    btnIcon: {
        fontSize: '1rem', lineHeight: 1,
        fontWeight: 300,
    },
};
