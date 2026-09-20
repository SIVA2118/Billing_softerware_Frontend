import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { fetchRoutes } from '../api/routeApi.js';

const SELECTED_ROUTE_STORAGE_KEY = 'billing_selected_route';
const ROUTE_LOCK_STORAGE_KEY = 'billing_route_locked';

export default function RouteManagement() {
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(() => (
        typeof window !== 'undefined' ? window.localStorage.getItem(SELECTED_ROUTE_STORAGE_KEY) || 'All Buyers' : 'All Buyers'
    ));
    const [routeLocked, setRouteLocked] = useState(() => (
        typeof window !== 'undefined' && window.localStorage.getItem(ROUTE_LOCK_STORAGE_KEY) === 'true'
    ));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRoutes()
            .then((response) => setRoutes(response.data.data || []))
            .catch(() => toast.error('Failed to load routes'))
            .finally(() => setLoading(false));
    }, []);

    const handleSelectRoute = (routeName) => {
        if (routeLocked) return;
        const nextRoute = routeName || 'All Buyers';
        setSelectedRoute(nextRoute);
        window.localStorage.setItem(SELECTED_ROUTE_STORAGE_KEY, nextRoute);
        setRouteLocked(true);
        window.localStorage.setItem(ROUTE_LOCK_STORAGE_KEY, 'true');
    };

    const handleUnlockRoute = () => {
        setRouteLocked(false);
        window.localStorage.setItem(ROUTE_LOCK_STORAGE_KEY, 'false');
    };

    return (
        <div className="page-shell" style={S.container}>
            <div className="page-header" style={S.pageHeader}>
                <div>
                    <h1 className="page-title-display" style={S.title}>Routes</h1>
                    <p style={S.subtitle}>Choose the buyer route for billing</p>
                </div>
            </div>

            <div className="route-panel" style={S.routePanel}>
                <div className="route-panel-top-line" style={S.routePanelTopLine} />
                <div className="route-panel-inner" style={S.routePanelInner}>
                    <div className="route-panel-header" style={S.routePanelHeader}>
                        <div className="route-panel-header-left" style={S.routePanelHeaderLeft}>
                            <span className="route-count" style={S.routeCount}>{routes.length} routes</span>
                        </div>
                        <div className="route-panel-header-actions" style={S.routePanelHeaderActions}>
                            {routeLocked && (
                                <button className="unlock-route-button" type="button" onClick={handleUnlockRoute} style={S.unlockBtn}>
                                    Unlock Route
                                </button>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ ...S.noRoutes, ...S.routeListInner }}>Loading routes...</div>
                    ) : routes.length === 0 ? (
                        <div style={{ ...S.noRoutes, ...S.routeListInner }}>No routes found.</div>
                    ) : (
                        <div className="route-tags-grid" style={{ ...S.routeListInner, ...S.routeTagsGrid }}>
                            <button
                                className={`route-tag${selectedRoute === 'All Buyers' ? ' route-tag-active' : ''}${routeLocked ? ' route-tag-locked' : ''}`}
                                type="button"
                                onClick={() => handleSelectRoute('All Buyers')}
                                disabled={routeLocked}
                                style={selectedRoute === 'All Buyers'
                                    ? { ...S.routeTag, ...S.routeTagActive, ...(routeLocked ? S.routeTagLocked : {}) }
                                    : { ...S.routeTag, ...(routeLocked ? S.routeTagLocked : {}) }}
                            >
                                <span className="route-tag-name" style={S.routeTagName}>All Buyers</span>
                            </button>
                            {routes.map((route) => (
                                <button
                                    className={`route-tag${selectedRoute === String(route.name || '') ? ' route-tag-active' : ''}${routeLocked ? ' route-tag-locked' : ''}`}
                                    key={route._id}
                                    type="button"
                                    onClick={() => handleSelectRoute(String(route.name || ''))}
                                    disabled={routeLocked}
                                    style={selectedRoute === String(route.name || '')
                                        ? { ...S.routeTag, ...S.routeTagActive, ...(routeLocked ? S.routeTagLocked : {}) }
                                        : { ...S.routeTag, ...(routeLocked ? S.routeTagLocked : {}) }}
                                >
                                    <span className="route-tag-name" style={S.routeTagName}>{route.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const S = {
    container: { maxWidth: '900px' },
    pageHeader: { marginBottom: '28px' },
    title: {
        margin: '0 0 4px',
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.5px',
    },
    subtitle: { margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem' },
    routePanel: {
        background: 'var(--route-panel-bg)',
        borderRadius: '24px', border: '1px solid rgba(76,125,190,0.62)',
        overflow: 'hidden', boxShadow: '0 16px 36px rgba(0,0,0,0.42), inset 0 0 0 1px rgba(255,255,255,0.05)',
    },
    routePanelTopLine: { height: '2px', background: 'var(--route-panel-top-line)' },
    routePanelInner: { padding: 0 },
    routePanelHeader: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '18px',
        padding: '22px 28px', marginBottom: 0,
        background: 'var(--route-header-bg)',
        borderBottom: '1px solid rgba(18,43,70,0.9)',
        boxShadow: 'inset 0 1px rgba(255,255,255,0.75), inset 0 -1px rgba(21,54,88,0.45)',
    },
    routePanelHeaderLeft: { display: 'flex', alignItems: 'center', gap: '18px', minWidth: 0 },
    routePanelHeaderActions: { display: 'flex', alignItems: 'center', gap: '10px' },
    routeCount: {
        width: '64px', height: '64px', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'var(--route-count-bg)', color: 'var(--route-count-text)',
        border: '2px solid var(--route-count-border)', borderRadius: '50%', padding: '6px',
        fontSize: '0.78rem', lineHeight: 1.15, fontWeight: 600, textAlign: 'center',
        boxShadow: 'var(--route-count-shadow)',
    },
    unlockBtn: {
        minWidth: 'auto', minHeight: '42px', background: 'var(--route-button-bg)', color: 'var(--route-button-text)',
        border: '1px solid var(--route-button-border)', borderRadius: '10px', padding: '0 16px', fontSize: '0.75rem',
        lineHeight: 1.2, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.2px',
        boxShadow: 'var(--route-button-shadow)',
    },
    noRoutes: { color: 'var(--text-muted)', fontSize: '0.9rem' },
    routeListInner: { padding: '26px 28px 32px' },
    routeTagsGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '18px' },
    routeTag: {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: '56px', padding: '12px 18px',
        background: 'color-mix(in srgb, var(--surface) 92%, transparent)', border: '1px solid var(--muted-border)',
        borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.9rem',
        boxShadow: 'var(--shadow-card)', cursor: 'pointer', outline: 'none', transition: 'filter 0.15s, transform 0.15s',
    },
    routeTagActive: {
        background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.35)', color: '#2563eb',
        boxShadow: '0 4px 14px rgba(59,130,246,0.12)',
    },
    routeTagLocked: { opacity: 0.62, cursor: 'not-allowed' },
    routeTagName: { fontWeight: 600, whiteSpace: 'nowrap' },
};
