import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import { deleteBuyer, fetchBuyers } from '../api/buyerApi.js';
import { fetchRoutes, createRoute, deleteRoute } from '../api/routeApi.js';

export default function BuyerList() {
    const navigate = useNavigate();
    const [buyers, setBuyers] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState('All Routes');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showRoutePanel, setShowRoutePanel] = useState(false);
    const [newRouteName, setNewRouteName] = useState('');
    const [savingRoute, setSavingRoute] = useState(false);

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        try {
            const [buyersRes, routesRes] = await Promise.all([fetchBuyers(), fetchRoutes()]);
            const sortedBuyers = (buyersRes.data.data || []).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setBuyers(sortedBuyers);
            setRoutes(routesRes.data.data);
        } catch {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const formatBuyerCreatedAt = (value) => {
        if (!value) return null;
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const exportBuyerPdf = (label, data) => {
        if (!Array.isArray(data) || data.length === 0) {
            toast.error('No buyers available to export for this route');
            return;
        }

        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 40;
        const contentWidth = pageWidth - margin * 2;
        const lineHeight = 16;
        const safeText = (value) => (value && String(value).trim() ? String(value) : '—');
        const routeLabel = label || 'All Routes';
        const fileName = `${routeLabel}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'all-routes';

        let y = 40;
        const now = new Date();
        const generatedAt = now.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const drawPageHeader = (isFirstPage) => {
            if (isFirstPage) {
                doc.setFillColor('#0f172a');
                doc.rect(0, 0, pageWidth, 72, 'F');

                doc.setFontSize(24);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor('#ffffff');
                doc.text('Buyer List Report', margin, 40);

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor('#cbd5e1');
                doc.text(`Route: ${routeLabel}`, margin, 56);
                doc.text(`Generated: ${generatedAt}`, pageWidth - margin, 56, { align: 'right' });
            }

            doc.setDrawColor('#cbd5e1');
            doc.setLineWidth(0.5);
            doc.line(margin, 84, pageWidth - margin, 84);
            y = 100;
        };

        const grouped = data.reduce((acc, buyer) => {
            const route = buyer.route?.trim() || 'Unassigned';
            if (!acc[route]) acc[route] = [];
            acc[route].push(buyer);
            return acc;
        }, {});

        const routeKeys = Object.keys(grouped).sort((a, b) => {
            if (a === 'Unassigned') return 1;
            if (b === 'Unassigned') return -1;
            return a.localeCompare(b);
        });

        drawPageHeader(true);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#475569');
        doc.text(`Total Buyers: ${data.length}`, margin, y);
        doc.text(`Route Groups: ${routeKeys.length}`, pageWidth - margin, y, { align: 'right' });
        y += 22;

        routeKeys.forEach((routeKey, routeIndex) => {
            const routeTitle = `${routeIndex + 1}. ${routeKey}`;
            const routeTitleHeight = 20;
            if (y + routeTitleHeight > pageHeight - margin - 60) {
                doc.addPage();
                drawPageHeader(false);
            }

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor('#1d4ed8');
            doc.text(routeTitle, margin, y);
            y += 20;

            grouped[routeKey].forEach((buyer, buyerIndex) => {
                const buyerName = `${buyerIndex + 1}. ${safeText(buyer.name)}`;
                const addressLines = doc.splitTextToSize(`Address: ${safeText(buyer.address)}`, contentWidth - 32);
                const contactLines = doc.splitTextToSize(
                    `Phone: ${safeText(buyer.phone)} | Created: ${formatBuyerCreatedAt(buyer.createdAt) || '—'}`,
                    contentWidth - 32,
                );
                const cardHeight = 22 + addressLines.length * lineHeight + contactLines.length * lineHeight + 12;

                if (y + cardHeight > pageHeight - margin - 40) {
                    doc.addPage();
                    drawPageHeader(false);
                }

                doc.setFillColor('#f8fafc');
                doc.roundedRect(margin, y - 6, contentWidth, cardHeight, 10, 10, 'F');
                doc.setDrawColor('#cbd5e1');
                doc.setLineWidth(0.8);
                doc.roundedRect(margin, y - 6, contentWidth, cardHeight, 10, 10, 'S');

                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor('#0f172a');
                doc.text(buyerName, margin + 14, y + 10);

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor('#475569');
                doc.text(addressLines, margin + 14, y + 28);
                doc.text(contactLines, margin + 14, y + 28 + addressLines.length * lineHeight);

                y += cardHeight + 16;
            });
        });

        const totalPages = doc.getNumberOfPages();
        for (let page = 1; page <= totalPages; page += 1) {
            doc.setPage(page);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor('#94a3b8');
            doc.text(`Page ${page} of ${totalPages}`, pageWidth - margin, pageHeight - 24, { align: 'right' });
        }

        doc.save(`buyers-${fileName}.pdf`);
    };

    const searchNormalized = String(searchQuery || '').trim().toLowerCase();
    const filteredByRoute = selectedRoute === 'All Routes'
        ? buyers
        : buyers.filter((buyer) => (buyer.route?.trim() || 'Unassigned') === selectedRoute);

    const filteredBuyers = searchNormalized
        ? filteredByRoute.filter((buyer) => {
            const terms = [buyer.name, buyer.address, buyer.route, buyer.phone].map((value) => String(value || '').toLowerCase());
            return terms.some((value) => value.includes(searchNormalized));
        })
        : filteredByRoute;

    const groupedAll = buyers.reduce((acc, buyer) => {
        const route = buyer.route?.trim() || 'Unassigned';
        if (!acc[route]) acc[route] = [];
        acc[route].push(buyer);
        return acc;
    }, {});

    const routeNames = Array.from(new Set([
        ...routes.map((r) => r.name?.trim()).filter(Boolean),
        ...Object.keys(groupedAll).filter((name) => name !== 'Unassigned'),
    ]));

    const routeKeys = routeNames.sort((a, b) => a.localeCompare(b));
    if (groupedAll['Unassigned'] && !routeKeys.includes('Unassigned')) {
        routeKeys.push('Unassigned');
    }

    const handleDeleteBuyer = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Delete this buyer?')) return;
        try {
            await deleteBuyer(id);
            toast.success('Buyer removed');
            loadAll();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete failed');
        }
    };

    const handleAddRoute = async (e) => {
        e.preventDefault();
        if (!newRouteName.trim()) { toast.error('Route name is required'); return; }
        setSavingRoute(true);
        try {
            await createRoute({ name: newRouteName.trim() });
            toast.success('Route created');
            setNewRouteName('');
            loadAll();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create route');
        } finally {
            setSavingRoute(false);
        }
    };

    const handleDeleteRoute = async (id, name, e) => {
        e.stopPropagation();
        if (!window.confirm(`Delete route "${name}"?`)) return;
        try {
            await deleteRoute(id);
            toast.success('Route deleted');
            loadAll();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete route');
        }
    };

    // Group buyers by their route
    const grouped = filteredBuyers.reduce((acc, buyer) => {
        const route = buyer.route?.trim() || 'Unassigned';
        if (!acc[route]) acc[route] = [];
        acc[route].push(buyer);
        return acc;
    }, {});

    // Sort: named routes alphabetically, Unassigned last
    const sortedRouteKeys = Object.keys(grouped).sort((a, b) => {
        if (a === 'Unassigned') return 1;
        if (b === 'Unassigned') return -1;
        return a.localeCompare(b);
    });

    return (
        <div className="page-shell" style={S.container}>
            <div className="page-header" style={S.header}>
                <div>
                    <h1 className="page-title-display" style={S.title}>Clientele</h1>
                    <p style={S.subtitle}>Manage buyers and view their invoice history</p>
                </div>
                <div style={S.headerActions}>
                    <button type="button" onClick={() => exportBuyerPdf(selectedRoute, selectedRoute === 'All Routes' ? buyers : filteredBuyers)} style={S.exportBtn}>
                        ⬇ Export PDF
                    </button>
                    <button type="button" onClick={() => setShowRoutePanel(v => !v)} style={S.routeBtn}>
                        ◈ Manage Routes
                    </button>
                    <Link to="/buyers/new" style={S.addBtn}>+ Add Buyer</Link>
                </div>
            </div>

            {/* ── Route Management Panel ── */}
            {showRoutePanel && (
                <div style={S.routePanel}>
                    <div style={S.routePanelTopLine} />
                    <div style={S.routePanelInner}>
                        <div style={S.routePanelHeader}>
                            <span style={S.routePanelTitle}>Route Management</span>
                            <span style={S.routeCount}>{routes.length} routes</span>
                        </div>

                        {/* Add new route */}
                        <form onSubmit={handleAddRoute} style={S.addRouteForm}>
                            <input
                                type="text"
                                value={newRouteName}
                                onChange={(e) => setNewRouteName(e.target.value)}
                                placeholder="New route name (e.g. North Zone, Route A)…"
                                style={S.routeInput}
                            />
                            <button type="submit" disabled={savingRoute} style={S.addRouteBtn}>
                                {savingRoute ? 'Adding…' : '+ Add Route'}
                            </button>
                        </form>

                        {/* Existing routes */}
                        {routes.length === 0 ? (
                            <div style={S.noRoutes}>No routes yet. Add one above.</div>
                        ) : (
                            <div style={S.routeTagsGrid}>
                                {routes.map(r => (
                                    <div key={r._id} style={S.routeTag}>
                                        <span style={S.routeTagName}>◈ {r.name}</span>
                                        <button
                                            onClick={(e) => handleDeleteRoute(r._id, r.name, e)}
                                            style={S.routeTagDelete}
                                            title="Delete route"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Buyer List ── */}
            <div style={S.card}>
                <div style={S.cardTopLine} />
                <div style={S.cardInner}>
                    <div style={S.cardHeader}>
                        <span style={S.cardTitle}>Saved Buyers</span>
                        <span style={S.cardCount}>{filteredBuyers.length}</span>
                    </div>

                    <div style={S.searchRow}>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search buyers by name, address, route or phone"
                            style={S.searchInput}
                        />
                    </div>

                    <div style={S.routeFilterRow}>
                        <button
                            type="button"
                            onClick={() => setSelectedRoute('All Routes')}
                            style={{
                                ...S.routeFilterBtn,
                                ...(selectedRoute === 'All Routes' ? S.routeFilterBtnActive : {}),
                            }}
                        >
                            All Routes
                        </button>
                        {routeKeys.map((routeKey) => (
                            <button
                                key={routeKey}
                                type="button"
                                onClick={() => setSelectedRoute(routeKey)}
                                style={{
                                    ...S.routeFilterBtn,
                                    ...(selectedRoute === routeKey ? S.routeFilterBtnActive : {}),
                                }}
                            >
                                {routeKey}
                                <span style={S.routeFilterCount}>{groupedAll[routeKey]?.length || 0}</span>
                            </button>
                        ))}
                    </div>

                    {loading && <div style={S.stateText}>Loading…</div>}
                    {!loading && buyers.length === 0 && (
                        <div style={S.emptyState}>
                            <div style={S.emptyIcon}>◉</div>
                            <p style={S.emptyText}>No buyers yet. Add your first client.</p>
                        </div>
                    )}

                    {!loading && buyers.length > 0 && (
                        <div style={S.listPane}>
                            <div style={S.listScroll}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                    {sortedRouteKeys.map(routeKey => (
                                        <div key={routeKey}>
                                            <div style={S.routeGroupHeader}>
                                                <span style={S.routeGroupIcon}>◈</span>
                                                <span style={S.routeGroupName}>{routeKey}</span>
                                                <span style={S.routeGroupCount}>{grouped[routeKey].length}</span>
                                            </div>
                                            <div style={S.list}>
                                                {grouped[routeKey].map((buyer) => (
                                                    <div
                                                        key={buyer._id}
                                                        className="responsive-list-item"
                                                        style={S.listItem}
                                                        onClick={() => navigate(`/?buyer=${encodeURIComponent(buyer.name)}`)}
                                                    >
                                                        <div style={S.buyerAvatar}>
                                                            {(buyer.name || 'B').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div style={S.listBody}>
                                                            <div style={S.buyerName}>{buyer.name}</div>
                                                            {buyer.address && <div style={S.metaText}>{buyer.address}</div>}
                                                            {buyer.createdAt && (
                                                                <div style={S.createdAtText}>{formatBuyerCreatedAt(buyer.createdAt)}</div>
                                                            )}
                                                            {buyer.phone && (
                                                                <div style={S.metaRow}>
                                                                    <span style={S.metaBadge}>{buyer.phone}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="responsive-list-actions" style={S.listActions}>
                                                            <span style={S.viewInvoicesLink}>View invoices →</span>
                                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); navigate('/new', { state: { buyer } }); }}
                                                                    style={S.invoiceBtn}
                                                                >
                                                                    Invoice
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); navigate(`/buyers/edit/${buyer._id}`); }}
                                                                    style={S.editBtn}
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button onClick={(e) => handleDeleteBuyer(buyer._id, e)} style={S.deleteBtn}>Remove</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const S = {
    container: { maxWidth: '900px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' },
    title: {
        margin: '0 0 4px',
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.5px',
    },
    subtitle: { margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem', letterSpacing: '0.3px' },
    headerActions: { display: 'flex', gap: '10px', alignItems: 'center' },
    routeBtn: {
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        background: 'linear-gradient(135deg, rgba(250,189,88,0.12), rgba(250,189,88,0.04))',
        border: '1px solid rgba(250,189,88,0.25)', color: 'var(--gold)',
        padding: '9px 18px', borderRadius: '9px',
        fontWeight: 500, fontSize: '0.8rem', letterSpacing: '0.3px',
        cursor: 'pointer',
    },
    addBtn: {
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(59,130,246,0.08))',
        border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6',
        padding: '9px 20px', borderRadius: '9px',
        fontWeight: 500, fontSize: '0.8rem', letterSpacing: '0.3px',
        textDecoration: 'none',
    },
    exportBtn: {
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        background: 'linear-gradient(135deg, rgba(34,197,94,0.16), rgba(34,197,94,0.08))',
        border: '1px solid rgba(34,197,94,0.28)', color: '#16a34a',
        padding: '9px 18px', borderRadius: '9px',
        fontWeight: 500, fontSize: '0.8rem', letterSpacing: '0.3px',
        cursor: 'pointer',
    },

    // Route panel
    routePanel: {
        background: 'var(--surface-gradient)',
        borderRadius: '16px', border: '1px solid rgba(250,189,88,0.15)',
        overflow: 'hidden', boxShadow: 'var(--shadow-card)',
        marginBottom: '24px',
    },
    routePanelTopLine: { height: '1px', background: 'linear-gradient(90deg, transparent, rgba(250,189,88,0.4), transparent)' },
    routePanelInner: { padding: '24px' },
    routePanelHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' },
    routePanelTitle: { fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' },
    routeCount: {
        background: 'rgba(250,189,88,0.08)', color: 'var(--gold)',
        border: '1px solid rgba(250,189,88,0.15)',
        borderRadius: '20px', padding: '2px 10px',
        fontSize: '0.7rem', fontWeight: 600,
    },
    addRouteForm: { display: 'flex', gap: '10px', marginBottom: '18px' },
    routeInput: {
        flex: 1, padding: '10px 14px',
        background: 'var(--field-bg)', border: '1px solid var(--field-border)',
        borderRadius: '9px', fontSize: '0.85rem', color: 'var(--text-primary)',
        outline: 'none',
    },
    addRouteBtn: {
        padding: '10px 18px', borderRadius: '9px',
        background: 'linear-gradient(135deg, rgba(250,189,88,0.15), rgba(250,189,88,0.06))',
        border: '1px solid rgba(250,189,88,0.25)', color: 'var(--gold)',
        fontWeight: 500, fontSize: '0.8rem', cursor: 'pointer', letterSpacing: '0.3px',
        whiteSpace: 'nowrap',
    },
    noRoutes: { color: 'var(--text-muted)', fontSize: '0.82rem', padding: '8px 0' },
    routeTagsGrid: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
    routeTag: {
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        background: 'rgba(250,189,88,0.06)', border: '1px solid rgba(250,189,88,0.15)',
        borderRadius: '20px', padding: '5px 12px',
    },
    routeTagName: { color: 'var(--gold)', fontSize: '0.8rem', fontWeight: 500 },
    routeTagDelete: {
        background: 'transparent', border: 'none', color: 'rgba(250,189,88,0.4)',
        cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0 2px',
        transition: 'color 0.15s',
    },

    searchRow: {
        marginBottom: '18px',
    },
    searchInput: {
        width: '100%', maxWidth: '420px', padding: '12px 16px',
        background: 'var(--field-bg)', border: '1px solid var(--field-border)',
        borderRadius: '12px', fontSize: '0.92rem', color: 'var(--text-primary)', outline: 'none',
    },
    routeFilterRow: {
        display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', alignItems: 'center',
    },
    routeFilterBtn: {
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.03)',
        color: 'var(--text-muted)',
        padding: '8px 14px',
        borderRadius: '999px',
        fontSize: '0.78rem',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.15s ease',
    },
    routeFilterBtnActive: {
        background: 'rgba(59,130,246,0.16)',
        borderColor: 'rgba(59,130,246,0.4)',
        color: '#3b82f6',
    },
    routeFilterCount: {
        background: 'rgba(255,255,255,0.06)',
        borderRadius: '999px',
        padding: '1px 8px',
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
    },

    // Buyer list card
    card: {
        background: 'var(--surface-gradient)',
        borderRadius: '16px', border: '1px solid var(--line-soft)',
        overflow: 'hidden', boxShadow: 'var(--shadow-card)',
    },
    cardTopLine: { height: '1px', background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.25), transparent)' },
    cardInner: {
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '0',
        height: 'calc(100vh - 220px)',
    },
    cardHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' },
    listPane: { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: '16px' },
    listScroll: { overflowY: 'auto', flex: 1, minHeight: 0, paddingRight: '6px', maxHeight: '100%' },
    cardTitle: { fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' },
    cardCount: {
        background: 'rgba(59,130,246,0.08)', color: '#3b82f6',
        border: '1px solid rgba(59,130,246,0.15)',
        borderRadius: '20px', padding: '2px 10px',
        fontSize: '0.7rem', fontWeight: 600,
    },

    // Route group header
    routeGroupHeader: {
        display: 'flex', alignItems: 'center', gap: '10px',
        marginBottom: '12px',
        paddingBottom: '10px',
        borderBottom: '1px solid var(--line-soft)',
    },
    routeGroupIcon: { color: 'var(--gold)', fontSize: '0.75rem', opacity: 0.6 },
    routeGroupName: {
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px',
    },
    routeGroupCount: {
        background: 'rgba(250,189,88,0.08)', color: 'var(--gold)',
        border: '1px solid rgba(250,189,88,0.12)',
        borderRadius: '20px', padding: '1px 8px', fontSize: '0.68rem', fontWeight: 600,
    },

    list: { display: 'flex', flexDirection: 'column', gap: '8px' },
    listItem: {
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '14px 16px',
        border: '1px solid var(--muted-border)',
        borderRadius: '10px', cursor: 'pointer',
        background: 'color-mix(in srgb, var(--surface) 92%, transparent)',
        transition: 'background 0.15s, border-color 0.15s',
    },
    buyerAvatar: {
        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
        background: 'rgba(59,130,246,0.08)',
        border: '1px solid rgba(59,130,246,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '1rem', fontWeight: 600, color: '#3b82f6',
    },
    listBody: { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' },
    buyerName: { fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-primary)' },
    metaText: { color: 'var(--text-muted)', fontSize: '0.75rem' },
    metaRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
    metaBadge: {
        background: 'rgba(59,130,246,0.06)', color: 'rgba(59,130,246,0.5)',
        border: '1px solid rgba(59,130,246,0.1)',
        borderRadius: '20px', padding: '2px 8px', fontSize: '0.68rem', fontWeight: 500,
    },
    createdAtText: { color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '2px' },
    listActions: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 },
    viewInvoicesLink: { fontSize: '0.7rem', color: 'rgba(59,130,246,0.4)', letterSpacing: '0.3px' },
    editBtn: {
        background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
        color: 'rgba(59,130,246,0.7)', padding: '4px 10px', borderRadius: '6px',
        fontSize: '0.68rem', fontWeight: 500, cursor: 'pointer', letterSpacing: '0.3px',
    },
    invoiceBtn: {
        background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)',
        color: 'rgba(34,197,94,0.9)', padding: '4px 10px', borderRadius: '6px',
        fontSize: '0.68rem', fontWeight: 500, cursor: 'pointer', letterSpacing: '0.3px',
    },
    deleteBtn: {
        background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.12)',
        color: 'rgba(248,113,113,0.5)', padding: '4px 10px', borderRadius: '6px',
        fontSize: '0.68rem', fontWeight: 500, cursor: 'pointer', letterSpacing: '0.3px',
    },
    stateText: { color: 'var(--text-muted)', fontSize: '0.82rem' },
    emptyState: { padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
    emptyIcon: { fontSize: '1.8rem', color: 'rgba(59,130,246,0.2)' },
    emptyText: { color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 },
};
