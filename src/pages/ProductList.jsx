import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchProducts, deleteProduct } from '../api/productApi';
import toast from 'react-hot-toast';

const fmt = (v) => Number(v || 0).toFixed(2);

const getProductDisplay = (p) => ({
    particulars: p.particulars || p.name || 'Untitled',
    category: p.category || '',
    qty: p.qty || '—',
    rate: p.rate ?? p.unitPrice ?? 0,
    grossAmt: p.grossAmt ?? p.unitPrice ?? 0,
    cgstPct: p.cgstPct ?? ((p.taxRate ?? 0) / 2),
    cgstAmt: p.cgstAmt ?? 0,
    sgstPct: p.sgstPct ?? ((p.taxRate ?? 0) / 2),
    sgstAmt: p.sgstAmt ?? 0,
    description: p.description || '',
});

export default function ProductList() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadProducts(); }, []);

    const loadProducts = async () => {
        try {
            const res = await fetchProducts();
            setProducts(res.data.data);
        } catch {
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this product?')) return;
        try {
            await deleteProduct(id);
            toast.success('Product deleted');
            loadProducts();
        } catch {
            toast.error('Delete failed');
        }
    };

    if (loading) return <div style={S.loading}>Loading catalogue…</div>;

    return (
        <div className="page-shell" style={S.container}>
            <div className="page-header" style={S.header}>
                <div>
                    <h1 className="page-title-display" style={S.title}>Product Catalogue</h1>
                    <p style={S.subtitle}>{products.length} product{products.length !== 1 ? 's' : ''} in catalogue</p>
                </div>
                <Link to="/products/new" style={S.addBtn}>+ Add Product</Link>
            </div>

            {products.length === 0 ? (
                <div style={S.emptyState}>
                    <div style={S.emptyIcon}>⬡</div>
                    <p style={S.emptyText}>No products yet. Add your first product.</p>
                    <Link to="/products/new" style={S.addBtn}>+ Add Product</Link>
                </div>
            ) : (
                <div style={S.grid}>
                    {products.map((product) => {
                        const item = getProductDisplay(product);
                        return (
                            <div key={product._id} style={S.card}>
                                <div style={S.cardAccent} />
                                <div style={S.cardBody}>
                                    <div style={S.cardTop}>
                                        <div style={S.prodName}>{item.particulars}</div>
                                        <div style={S.prodPrice}>₹{fmt(item.grossAmt)}</div>
                                    </div>
                                    {item.category && (
                                        <span style={S.categoryChip}>{item.category}</span>
                                    )}
                                    <div style={S.metaRow}>
                                        <span style={S.metaItem}>Qty: {item.qty}</span>
                                        <span style={S.metaDot}>·</span>
                                        <span style={S.metaItem}>Rate: ₹{fmt(item.rate)}</span>
                                    </div>
                                    {item.description && (
                                        <p style={S.desc}>{item.description}</p>
                                    )}
                                    <div style={S.taxRow}>
                                        <span style={S.taxChip}>CGST {item.cgstPct}%: ₹{fmt(item.cgstAmt)}</span>
                                        <span style={S.taxChip}>SGST {item.sgstPct}%: ₹{fmt(item.sgstAmt)}</span>
                                    </div>
                                    <div style={S.cardFooter}>
                                        <Link to={`/products/edit/${product._id}`} style={S.editBtn}>Edit</Link>
                                        <button onClick={() => handleDelete(product._id)} style={S.deleteBtn}>Delete</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

const S = {
    container: { maxWidth: '1160px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' },
    title: {
        margin: '0 0 4px',
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.5px',
    },
    subtitle: { margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem', letterSpacing: '0.3px' },
    addBtn: {
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        background: 'var(--accent-button-bg)',
        border: '1px solid var(--accent-button-border)', color: 'var(--gold)',
        padding: '9px 20px', borderRadius: '9px',
        fontWeight: 500, fontSize: '0.8rem', letterSpacing: '0.3px',
        textDecoration: 'none', cursor: 'pointer',
    },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
    card: {
        background: 'var(--surface-gradient)',
        border: '1px solid var(--line-soft)',
        borderRadius: '16px', overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
        transition: 'border-color 0.2s, transform 0.2s',
    },
    cardAccent: {
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)',
    },
    cardBody: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' },
    prodName: { fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 },
    prodPrice: {
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '1.1rem', fontWeight: 600, color: '#c9a84c', flexShrink: 0,
    },
    categoryChip: {
        alignSelf: 'flex-start',
        background: 'rgba(52,211,153,0.08)', color: '#34d399',
        border: '1px solid rgba(52,211,153,0.15)',
        borderRadius: '20px', padding: '3px 10px',
        fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.5px',
    },
    metaRow: { display: 'flex', alignItems: 'center', gap: '8px' },
    metaItem: { color: 'var(--text-muted)', fontSize: '0.75rem' },
    metaDot: { color: 'rgba(201,168,76,0.2)', fontSize: '0.7rem' },
    desc: { color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0, lineHeight: 1.5 },
    taxRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
    taxChip: {
        background: 'rgba(201,168,76,0.06)', color: 'rgba(201,168,76,0.5)',
        border: '1px solid rgba(201,168,76,0.1)',
        borderRadius: '6px', padding: '3px 8px',
        fontSize: '0.68rem', fontWeight: 500,
    },
    cardFooter: {
        display: 'flex', justifyContent: 'flex-end', gap: '10px',
        paddingTop: '12px',
        borderTop: '1px solid var(--table-row-border)',
    },
    editBtn: { color: 'var(--gold)', fontSize: '0.78rem', fontWeight: 500, letterSpacing: '0.3px', textDecoration: 'none' },
    deleteBtn: { color: 'rgba(248,113,113,0.6)', background: 'none', border: 'none', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer' },
    loading: { display: 'flex', justifyContent: 'center', padding: '80px', color: 'var(--text-muted)', fontSize: '0.85rem' },
    emptyState: { textAlign: 'center', padding: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' },
    emptyIcon: { fontSize: '2rem', color: 'rgba(201,168,76,0.2)' },
    emptyText: { color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 },
};
