import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import { deleteBuyer, fetchBuyers } from '../api/buyerApi.js';

const SELECTED_ROUTE_STORAGE_KEY = 'billing_selected_route';

export default function BuyerList() {
    const navigate = useNavigate();
    const location = useLocation();
    const [buyers, setBuyers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRoute, setSelectedRoute] = useState(() => (
        typeof window !== 'undefined' ? window.localStorage.getItem(SELECTED_ROUTE_STORAGE_KEY) || 'All Buyers' : 'All Buyers'
    ));
    const [loading, setLoading] = useState(true);
    const [carouselIndex, setCarouselIndex] = useState(0);

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        try {
            const buyersRes = await fetchBuyers();
            const toBuyerTimestamp = (buyer) => {
                const timestamp = new Date(buyer.createdAt).getTime();
                return Number.isFinite(timestamp) ? timestamp : Infinity;
            };
            const sortedBuyers = (buyersRes.data.data || []).slice().sort((a, b) => {
                const timeDifference = toBuyerTimestamp(a) - toBuyerTimestamp(b);
                if (timeDifference !== 0) return timeDifference;
                return String(a.name || '').localeCompare(String(b.name || ''));
            });
            setBuyers(sortedBuyers);
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

    const searchNormalized = String(searchQuery || '').trim().toLowerCase();
    const filteredBuyers = buyers.filter((buyer) => {
        const routeMatch = selectedRoute === 'All Buyers' || String(buyer.route || 'Unassigned').trim() === selectedRoute;
        if (!routeMatch) return false;
        if (!searchNormalized) return true;
        const terms = [buyer.name, buyer.address, buyer.route, buyer.phone].map((value) => String(value || '').toLowerCase());
        return terms.some((value) => value.includes(searchNormalized));
    });

    useEffect(() => {
        setCarouselIndex((currentIndex) => Math.min(currentIndex, Math.max(filteredBuyers.length - 1, 0)));
    }, [filteredBuyers.length]);

    useEffect(() => {
        const focusBuyerId = location.state?.focusBuyerId;
        if (!focusBuyerId || !filteredBuyers.length) return;
        const nextIndex = filteredBuyers.findIndex((buyer) => buyer._id === focusBuyerId);
        if (nextIndex < 0) return;
        setCarouselIndex(nextIndex);
        navigate(location.pathname, { replace: true });
    }, [filteredBuyers, location.pathname, location.state, navigate]);

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
                    <Link to="/buyers/new" style={S.addBtn}>+ Add Buyer</Link>
                </div>
            </div>

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
                                {filteredBuyers.length === 0 ? (
                                    <div style={S.stateText}>No buyers match your search.</div>
                                ) : (
                                    <div style={S.carouselShell}>
                                        <button
                                            type="button"
                                            aria-label="Previous buyer"
                                            onClick={() => setCarouselIndex((currentIndex) => Math.max(currentIndex - 1, 0))}
                                            disabled={carouselIndex === 0}
                                            style={{ ...S.carouselButton, ...(carouselIndex === 0 ? S.carouselButtonDisabled : {}) }}
                                        >
                                            ‹
                                        </button>
                                        <div style={S.listViewport}>
                                            <div style={{ ...S.list, transform: `translateX(-${carouselIndex * 100}%)` }}>
                                            {filteredBuyers.map((buyer, buyerIndex) => (
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
                                                        <div style={S.actionButtons}>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate('/new', {
                                                                        state: {
                                                                            buyer,
                                                                            buyerQueue: filteredBuyers,
                                                                            buyerIndex,
                                                                        },
                                                                    });
                                                                }}
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
                                        <button
                                            type="button"
                                            aria-label="Next buyer"
                                            onClick={() => setCarouselIndex((currentIndex) => Math.min(currentIndex + 1, filteredBuyers.length - 1))}
                                            disabled={carouselIndex === filteredBuyers.length - 1}
                                            style={{ ...S.carouselButton, ...(carouselIndex === filteredBuyers.length - 1 ? S.carouselButtonDisabled : {}) }}
                                        >
                                            ›
                                        </button>
                                    </div>
                                )}
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
        background: 'linear-gradient(145deg, #151c2a 0%, #080d16 100%)',
        borderRadius: '24px', border: '1px solid rgba(76,125,190,0.62)',
        overflow: 'hidden', boxShadow: '0 16px 36px rgba(0,0,0,0.42), inset 0 0 0 1px rgba(255,255,255,0.05)',
        marginBottom: '24px',
    },
    routePanelTopLine: { height: '2px', background: 'linear-gradient(90deg, #1c4679, #9cc9ff 50%, #1c4679)' },
    routePanelInner: { padding: 0 },
    routePanelHeader: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '18px',
        padding: '22px 28px', marginBottom: 0,
        background: 'linear-gradient(105deg, #b9d4e9 0%, #7397b8 48%, #b3d0e7 100%)',
        borderBottom: '1px solid rgba(18,43,70,0.9)',
        boxShadow: 'inset 0 1px rgba(255,255,255,0.75), inset 0 -1px rgba(21,54,88,0.45)',
    },
    routePanelHeaderLeft: { display: 'flex', alignItems: 'center', gap: '18px', minWidth: 0 },
    routePanelTitle: { fontSize: '1.05rem', fontWeight: 700, color: '#173452', letterSpacing: '1.1px', textTransform: 'uppercase', lineHeight: 1.25, textShadow: '0 1px rgba(255,255,255,0.35)' },
    routePanelHeaderActions: { display: 'flex', alignItems: 'center', gap: '10px' },
    routeCount: {
        width: '64px', height: '64px', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(circle at 35% 25%, #2f4e70, #070c14 68%)', color: '#a9d5ff',
        border: '2px solid #6399cc', borderRadius: '50%', padding: '6px',
        fontSize: '0.78rem', lineHeight: 1.15, fontWeight: 600, textAlign: 'center',
        boxShadow: '0 2px 0 #1c3652, 0 4px 9px rgba(0,0,0,0.26), inset 0 0 0 1px #101e2d',
    },
    unlockBtn: {
        minWidth: 'auto', minHeight: '42px', background: 'linear-gradient(135deg, #315b83, #1d3858)', color: '#e0f2ff',
        border: '1px solid #79a8d3', borderRadius: '10px', padding: '0 16px', fontSize: '0.75rem',
        lineHeight: 1.2, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.2px',
        boxShadow: '0 3px 8px rgba(15,35,58,0.28), inset 0 1px rgba(255,255,255,0.25)',
    },
    noRoutes: { color: '#9fc1df', fontSize: '0.9rem' },
    routeListInner: { padding: '26px 28px 32px' },
    routeTagsGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '18px' },
    routeTag: {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: '56px', padding: '12px 18px',
        background: 'color-mix(in srgb, var(--surface) 92%, transparent)', border: '1px solid var(--muted-border)',
        borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.9rem',
        boxShadow: 'var(--shadow-card)',
        cursor: 'pointer', outline: 'none', transition: 'filter 0.15s, transform 0.15s',
    },
    routeTagActive: {
        background: 'rgba(59,130,246,0.1)',
        border: '1px solid rgba(59,130,246,0.35)', color: '#2563eb',
        boxShadow: '0 4px 14px rgba(59,130,246,0.12)',
    },
    routeTagLocked: { opacity: 0.62, cursor: 'not-allowed' },
    routeTagName: { fontWeight: 600, whiteSpace: 'nowrap' },

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
    listScroll: { overflow: 'hidden', flex: 1, minHeight: 0, paddingRight: '6px', maxHeight: '100%' },
    cardTitle: { fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' },
    cardCount: {
        background: 'rgba(59,130,246,0.08)', color: '#3b82f6',
        border: '1px solid rgba(59,130,246,0.15)',
        borderRadius: '20px', padding: '2px 10px',
        fontSize: '0.7rem', fontWeight: 600,
    },

    // Route group header
    carouselShell: { display: 'flex', alignItems: 'center', gap: '12px', height: '100%' },
    carouselButton: {
        width: '38px', height: '58px', flexShrink: 0,
        border: '1px solid rgba(59,130,246,0.24)', borderRadius: '10px',
        background: 'rgba(59,130,246,0.08)', color: '#3b82f6',
        fontSize: '2rem', lineHeight: 1, cursor: 'pointer',
    },
    carouselButtonDisabled: { opacity: 0.28, cursor: 'not-allowed' },
    listViewport: { flex: '1 1 0', minWidth: 0, overflow: 'hidden' },
    list: { display: 'flex', width: '100%', gap: '0', transition: 'transform 0.25s ease' },
    listItem: {
        display: 'flex', flex: '0 0 100%', width: '100%', minWidth: 0, boxSizing: 'border-box',
        flexDirection: 'column', alignItems: 'flex-start', gap: '16px',
        padding: '14px 16px',
        border: '1px solid var(--muted-border)',
        borderRadius: '10px', cursor: 'pointer',
        position: 'relative',
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
    actionButtons: { display: 'flex', gap: '6px', flexWrap: 'wrap', width: '100%' },
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
        position: 'absolute', top: '14px', right: '14px',
    },
    stateText: { color: 'var(--text-muted)', fontSize: '0.82rem' },
    emptyState: { padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
    emptyIcon: { fontSize: '1.8rem', color: 'rgba(59,130,246,0.2)' },
    emptyText: { color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 },
};
