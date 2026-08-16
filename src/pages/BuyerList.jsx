import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import { deleteBuyer, fetchBuyers } from '../api/buyerApi.js';
import { fetchRoutes } from '../api/routeApi.js';

export default function BuyerList() {
    const navigate = useNavigate();
    const [buyers, setBuyers] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRoute, setSelectedRoute] = useState('All Buyers');
    const [loading, setLoading] = useState(true);
    const [showRoutePanel, setShowRoutePanel] = useState(false);

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        try {
            const [buyersRes, routesRes] = await Promise.all([fetchBuyers(), fetchRoutes()]);
            const sortedBuyers = (buyersRes.data.data || []).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setBuyers(sortedBuyers);
            setRoutes(routesRes.data.data || []);
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
            toast.error('No buyers available to export');
            return;
        }

        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 40;
        const contentWidth = pageWidth - margin * 2;
        const lineHeight = 16;
        const safeText = (value) => (value && String(value).trim() ? String(value) : '—');
        const routeLabel = label || 'All Buyers';
        const fileName = `${routeLabel}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'all-buyers';

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
                doc.text(`Scope: ${routeLabel}`, margin, 56);
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

    const handleSelectRoute = (routeName) => {
        if (!routeName) {
            setSelectedRoute('All Buyers');
            return;
        }
        setSelectedRoute(routeName);
        setShowRoutePanel(true);
    };

    const searchNormalized = String(searchQuery || '').trim().toLowerCase();
    const filteredBuyers = buyers.filter((buyer) => {
        const routeMatch = selectedRoute === 'All Buyers' || String(buyer.route || 'Unassigned').trim() === selectedRoute;
        if (!routeMatch) return false;
        if (!searchNormalized) return true;
        const terms = [buyer.name, buyer.address, buyer.route, buyer.phone].map((value) => String(value || '').toLowerCase());
        return terms.some((value) => value.includes(searchNormalized));
    });

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

    return (
        <div className="page-shell" style={S.container}>
            <div className="page-header" style={S.header}>
                <div>
                    <h1 className="page-title-display" style={S.title}>Clientele</h1>
                    <p style={S.subtitle}>Manage buyers and view their invoice history</p>
                </div>
                <div style={S.headerActions}>
                    <button type="button" onClick={() => exportBuyerPdf('All Buyers', filteredBuyers)} style={S.exportBtn}>
                        ⬇ Export PDF
                    </button>
                    <button type="button" onClick={() => setShowRoutePanel((prev) => !prev)} style={S.routeBtn}>
                        {showRoutePanel ? 'Hide Routes' : 'Manage Routes'}
                    </button>
                    <Link to="/buyers/new" style={S.addBtn}>+ Add Buyer</Link>
                </div>
            </div>

            {showRoutePanel && (
                <div style={S.routePanel}>
                    <div style={S.routePanelTopLine} />
                    <div style={S.routePanelInner}>
                        <div style={S.routePanelHeader}>
                            <span style={S.routePanelTitle}>Route Management</span>
                            <span style={S.routeCount}>{routes.length} routes</span>
                        </div>
                        {routes.length === 0 ? (
                            <div style={S.noRoutes}>No routes found.</div>
                        ) : (
                            <div style={S.routeTagsGrid}>
                                <button
                                    type="button"
                                    onClick={() => handleSelectRoute('All Buyers')}
                                    style={selectedRoute === 'All Buyers' ? { ...S.routeTag, ...S.routeTagActive } : S.routeTag}
                                >
                                    <span style={S.routeTagName}>All Buyers</span>
                                </button>
                                {routes.map((route) => (
                                    <button
                                        key={route._id}
                                        type="button"
                                        onClick={() => handleSelectRoute(String(route.name || ''))}
                                        style={selectedRoute === String(route.name || '') ? { ...S.routeTag, ...S.routeTagActive } : S.routeTag}
                                    >
                                        <span style={S.routeTagName}>{route.name}</span>
                                    </button>
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
                            id="search_buyers"
                            name="search_buyers"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search buyers by name, address or phone"
                            style={S.searchInput}
                        />
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
                                    <div>
                                        <div style={S.list}>
                                            {filteredBuyers.map((buyer) => (
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
    routeBtn: {
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(59,130,246,0.08))',
        border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6',
        padding: '9px 18px', borderRadius: '9px',
        fontWeight: 500, fontSize: '0.8rem', letterSpacing: '0.3px',
        cursor: 'pointer',
    },
    routePanel: {
        background: 'var(--surface-gradient)',
        borderRadius: '16px', border: '1px solid rgba(59,130,246,0.15)',
        overflow: 'hidden', boxShadow: 'var(--shadow-card)',
        marginBottom: '24px',
    },
    routePanelTopLine: { height: '1px', background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent)' },
    routePanelInner: { padding: '20px 24px' },
    routePanelHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '16px' },
    routePanelTitle: { fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' },
    routeCount: {
        background: 'rgba(59,130,246,0.08)', color: '#3b82f6',
        border: '1px solid rgba(59,130,246,0.15)',
        borderRadius: '20px', padding: '4px 12px',
        fontSize: '0.72rem', fontWeight: 600,
    },
    noRoutes: { color: 'var(--text-muted)', fontSize: '0.9rem', padding: '12px 0' },
    routeTagsGrid: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
    routeTag: {
        display: 'inline-flex', alignItems: 'center', padding: '10px 14px',
        background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)',
        borderRadius: '14px', color: '#1d4ed8', fontSize: '0.82rem',
        cursor: 'pointer', outline: 'none',
    },
    routeTagActive: {
        background: 'rgba(59,130,246,0.16)',
        border: '1px solid rgba(37,99,235,0.35)',
        color: '#1d4ed8',
    },
    routeTagName: { fontWeight: 600 },

    searchRow: {
        marginBottom: '18px',
    },
    searchInput: {
        width: '100%', maxWidth: '420px', padding: '12px 16px',
        background: 'var(--field-bg)', border: '1px solid var(--field-border)',
        borderRadius: '12px', fontSize: '0.92rem', color: 'var(--text-primary)', outline: 'none',
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
