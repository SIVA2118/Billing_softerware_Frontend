import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { deleteBuyer, fetchBuyers } from '../api/buyerApi.js';

export default function BuyerList() {
    const navigate = useNavigate();
    const [buyers, setBuyers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadBuyers(); }, []);

    const loadBuyers = async () => {
        try {
            const res = await fetchBuyers();
            setBuyers(res.data.data);
        } catch {
            toast.error('Failed to load buyers');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Delete this buyer?')) return;
        try {
            await deleteBuyer(id);
            toast.success('Buyer removed');
            loadBuyers();
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
                <Link to="/buyers/new" style={S.addBtn}>+ Add Buyer</Link>
            </div>

            <div style={S.card}>
                <div style={S.cardTopLine} />
                <div style={S.cardInner}>
                    <div style={S.cardHeader}>
                        <span style={S.cardTitle}>Saved Buyers</span>
                        <span style={S.cardCount}>{buyers.length}</span>
                    </div>

                    {loading && <div style={S.stateText}>Loading buyers…</div>}
                    {!loading && buyers.length === 0 && (
                        <div style={S.emptyState}>
                            <div style={S.emptyIcon}>◉</div>
                            <p style={S.emptyText}>No buyers yet. Add your first client.</p>
                        </div>
                    )}
                    {!loading && buyers.length > 0 && (
                        <div style={S.list}>
                            {buyers.map((buyer) => (
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
                                        <div style={S.metaRow}>
                                            {buyer.route && <span style={S.metaBadge}>Route: {buyer.route}</span>}
                                            {buyer.phone && <span style={S.metaBadge}>{buyer.phone}</span>}
                                        </div>
                                    </div>
                                    <div className="responsive-list-actions" style={S.listActions}>
                                        <span style={S.viewInvoicesLink}>View invoices →</span>
                                        <button onClick={(e) => handleDelete(buyer._id, e)} style={S.deleteBtn}>Remove</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const S = {
    container: { maxWidth: '860px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' },
    title: {
        margin: '0 0 4px',
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.5px',
    },
    subtitle: { margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem', letterSpacing: '0.3px' },
    addBtn: {
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(59,130,246,0.08))',
        border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6',
        padding: '9px 20px', borderRadius: '9px',
        fontWeight: 500, fontSize: '0.8rem', letterSpacing: '0.3px',
        textDecoration: 'none',
    },
    card: {
        background: 'var(--surface-gradient)',
        borderRadius: '16px', border: '1px solid var(--line-soft)',
        overflow: 'hidden', boxShadow: 'var(--shadow-card)',
    },
    cardTopLine: { height: '1px', background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.25), transparent)' },
    cardInner: { padding: '24px' },
    cardHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
    cardTitle: { fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' },
    cardCount: {
        background: 'rgba(59,130,246,0.08)', color: '#3b82f6',
        border: '1px solid rgba(59,130,246,0.15)',
        borderRadius: '20px', padding: '2px 10px',
        fontSize: '0.7rem', fontWeight: 600,
    },
    list: { display: 'flex', flexDirection: 'column', gap: '8px' },
    listItem: {
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '16px 18px',
        border: '1px solid var(--muted-border)',
        borderRadius: '10px', cursor: 'pointer',
        background: 'color-mix(in srgb, var(--surface) 92%, transparent)',
        transition: 'background 0.15s, border-color 0.15s',
    },
    buyerAvatar: {
        width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
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
    listActions: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 },
    viewInvoicesLink: { fontSize: '0.7rem', color: 'rgba(59,130,246,0.4)', letterSpacing: '0.3px' },
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
