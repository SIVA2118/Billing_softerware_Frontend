import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const allNavItems = [
    { group: 'OVERVIEW', items: [
        { to: '/', label: 'Invoices', icon: '◈' },
        { to: '/new', label: 'New Invoice', icon: '⊕' },
        { to: '/bill-amount', label: 'Bill Amount', icon: '₹' },
    ]},
    { group: 'CATALOGUE', items: [
        { to: '/products', label: 'Products', icon: '⬡' },
        { to: '/categories', label: 'Categories', icon: '⊟' },
    ]},
    { group: 'CLIENTELE', items: [
        { to: '/buyers', label: 'Buyers', icon: '◉' },
        { to: '/buyers/new', label: 'Add Buyer', icon: '⊞' },
    ]},
    { group: 'TEAM', items: [
        { to: '/employees', label: 'Employee List', icon: '◎' },
        { to: '/employees/new', label: 'Add Employee', icon: '◌' },
    ]},
];

const EMPLOYEE_GROUPS = ['OVERVIEW', 'CLIENTELE'];

export default function Sidebar({ isOpen, onClose, onLogout, onNavigate, user }) {
    const location = useLocation();
    const navigate = useNavigate();

    const isEmployee = user?.role === 'employee';
    const navItems = isEmployee
        ? allNavItems.filter(g => EMPLOYEE_GROUPS.includes(g.group))
        : allNavItems;

    const handleLogout = () => { onLogout(); navigate('/login'); };
    const isActive = (path) => location.pathname === path;

    const displayName = user?.username || 'Administrator';
    const displayRole = user?.role === 'employee' ? 'Employee' : 'System Access';
    const avatarLetter = displayName.charAt(0).toUpperCase();

    return (
        <aside className={`app-sidebar${isOpen ? ' is-open' : ''}`} style={S.sidebar}>
            {/* Decorative top gradient line */}
            <div style={S.topLine} />

            {/* Brand */}
            <div style={S.brand}>
                <div style={S.brandMark}>
                    <span style={S.brandMarkText}>₹</span>
                </div>
                <div>
                    <div style={S.brandName}>BillFlow</div>
                    <div style={S.brandSub}>Invoice & CRM</div>
                </div>
                <button type="button" className="sidebar-close-btn" style={S.closeBtn} onClick={onClose}>
                    ✕
                </button>
            </div>

            {/* Divider */}
            <div style={S.divider} />

            {/* Nav */}
            <nav style={S.nav}>
                {navItems.map(({ group, items }) => (
                    <div key={group} style={S.navGroup}>
                        <div style={S.groupLabel}>{group}</div>
                        {items.map(({ to, label, icon }) => {
                            const active = isActive(to);
                            return (
                                <Link
                                    key={to}
                                    to={to}
                                    onClick={onNavigate}
                                    style={{ ...S.navLink, ...(active ? S.navLinkActive : {}) }}
                                >
                                    {active && <div style={S.activeBar} />}
                                    <span style={{ ...S.navIcon, ...(active ? S.navIconActive : {}) }}>{icon}</span>
                                    <span style={active ? S.navLabelActive : S.navLabel}>{label}</span>
                                    {active && <div style={S.activeDot} />}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div style={S.footer}>
                <div style={S.footerDivider} />
                <div style={S.footerUser}>
                    <div style={S.footerAvatar}>{avatarLetter}</div>
                    <div style={S.footerInfo}>
                        <div style={S.footerName}>{displayName}</div>
                        <div style={S.footerRole}>{displayRole}</div>
                    </div>
                </div>
                <button onClick={handleLogout} style={S.logoutBtn}>
                    Sign Out
                </button>
            </div>
        </aside>
    );
}

const S = {
    sidebar: {
        width: '260px',
        height: '100vh',
        background: 'var(--sidebar-gradient)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0, top: 0,
        zIndex: 100,
        borderRight: '1px solid var(--line-soft)',
    },
    topLine: {
        height: '2px',
        background: 'var(--top-line-gradient)',
    },
    brand: {
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '24px 22px 20px',
    },
    closeBtn: {
        marginLeft: 'auto',
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        border: '1px solid var(--line-medium)',
        background: 'var(--field-bg)',
        color: 'var(--gold)',
        display: 'none',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.82rem',
        flexShrink: 0,
    },
    brandMark: {
        width: '42px', height: '42px',
        background: 'var(--accent-chip-bg)',
        border: '1px solid var(--accent-button-border)',
        borderRadius: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        boxShadow: 'var(--shadow-gold)',
    },
    brandMarkText: {
        fontSize: '1.2rem', fontWeight: 700,
        color: '#3b82f6',
        fontFamily: 'Cormorant Garamond, Georgia, serif',
    },
    brandName: {
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '1.25rem', fontWeight: 600,
        color: 'var(--text-primary)', letterSpacing: '0.5px',
    },
    brandSub: {
        fontSize: '0.62rem', color: 'color-mix(in srgb, var(--gold) 70%, transparent)',
        marginTop: '1px', letterSpacing: '1.5px', textTransform: 'uppercase',
        fontWeight: 500,
    },
    divider: {
        height: '1px',
        margin: '0 22px',
        background: 'linear-gradient(90deg, transparent, var(--line-medium), transparent)',
    },
    nav: { flex: 1, overflowY: 'auto', padding: '16px 0 0' },
    navGroup: { marginBottom: '4px' },
    groupLabel: {
        fontSize: '0.58rem', fontWeight: 600, letterSpacing: '2px',
        color: 'color-mix(in srgb, var(--gold) 45%, transparent)', textTransform: 'uppercase',
        padding: '10px 22px 6px',
    },
    navLink: {
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '10px 22px',
        color: 'var(--text-muted)',
        fontSize: '0.82rem', fontWeight: 400,
        position: 'relative',
        transition: 'all 0.2s',
        textDecoration: 'none',
        letterSpacing: '0.2px',
    },
    navLinkActive: {
        color: 'var(--text-primary)',
        background: 'var(--gold-dim)',
    },
    activeBar: {
        position: 'absolute',
        left: 0, top: '4px', bottom: '4px',
        width: '2px',
        background: 'linear-gradient(180deg, var(--gold-light, #60a5fa), var(--gold, #3b82f6))',
        borderRadius: '0 2px 2px 0',
    },
    navIcon: {
        fontSize: '0.9rem', width: '20px', textAlign: 'center', flexShrink: 0,
        color: 'var(--text-ghost)',
        transition: 'color 0.2s',
    },
    navIconActive: { color: 'var(--gold)' },
    navLabel: { color: 'var(--text-secondary)', fontWeight: 400 },
    navLabelActive: { color: 'var(--text-primary)', fontWeight: 500 },
    activeDot: {
        width: '4px', height: '4px',
        background: '#3b82f6',
        borderRadius: '50%',
        marginLeft: 'auto',
        flexShrink: 0,
    },
    footer: {
        padding: '0 16px 20px',
    },
    footerDivider: {
        height: '1px',
        marginBottom: '16px',
        background: 'linear-gradient(90deg, transparent, var(--line-medium), transparent)',
    },
    footerUser: {
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 6px',
        marginBottom: '10px',
    },
    footerAvatar: {
        width: '32px', height: '32px',
        background: 'var(--gold-dim)',
        border: '1px solid var(--gold-border)',
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '0.9rem', fontWeight: 600, color: '#3b82f6',
        flexShrink: 0,
    },
    footerName: { fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-primary)' },
    footerRole: { fontSize: '0.62rem', color: 'color-mix(in srgb, var(--gold) 55%, transparent)', letterSpacing: '0.8px', textTransform: 'uppercase' },
    footerInfo: { flex: 1 },
    logoutBtn: {
        width: '100%', padding: '9px 12px',
        background: 'rgba(248,113,113,0.06)',
        color: 'rgba(248,113,113,0.6)',
        border: '1px solid rgba(248,113,113,0.12)',
        borderRadius: '8px',
        fontWeight: 500, fontSize: '0.78rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        cursor: 'pointer',
        letterSpacing: '0.5px',
        transition: 'all 0.2s',
    },
};
