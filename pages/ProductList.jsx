import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { fetchProducts, deleteProduct } from '../api/productApi';
import { fetchCategories } from '../api/categoryApi';
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
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => { loadCategories(); }, []);

    useEffect(() => {
        if (!categories.length) {
            loadProducts(searchParams.get('category') || '');
            return;
        }

        const categoryQuery = searchParams.get('category') || categories[0]?.name || '';
        setSelectedCategory(categoryQuery);
    }, [categories, searchParams]);

    useEffect(() => {
        loadProducts(selectedCategory);
    }, [selectedCategory]);

    const loadCategories = async () => {
        try {
            const res = await fetchCategories();
            setCategories(res.data.data);
        } catch {
            toast.error('Failed to load categories');
        }
    };

    const loadProducts = async (category = '') => {
        try {
            setLoading(true);
            const res = await fetchProducts(category);
            setProducts(res.data.data);
        } catch {
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const exportProductPdf = (category, data) => {
        if (!Array.isArray(data) || data.length === 0) {
            toast.error('No products available to export');
            return;
        }

        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 40;
        const contentWidth = pageWidth - margin * 2;
        const lineHeight = 16;
        const safeText = (value) => (value && String(value).trim() ? String(value) : '—');
        const catalogueLabel = category || 'All Categories';
        const fileName = `product-catalogue-${catalogueLabel}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'product-catalogue';
        const now = new Date();
        const generatedAt = now.toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
        });

        let y = 40;

        const drawHeader = (isFirstPage) => {
            if (isFirstPage) {
                doc.setFillColor('#0f172a');
                doc.rect(0, 0, pageWidth, 72, 'F');
                doc.setFontSize(24);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor('#ffffff');
                doc.text('Product Catalogue', margin, 40);

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor('#cbd5e1');
                doc.text(`Category: ${catalogueLabel}`, margin, 56);
                doc.text(`Generated: ${generatedAt}`, pageWidth - margin, 56, { align: 'right' });
            }

            doc.setDrawColor('#cbd5e1');
            doc.setLineWidth(0.5);
            doc.line(margin, 84, pageWidth - margin, 84);
            y = 100;
        };

        const grouped = data.reduce((acc, product) => {
            const categoryKey = product.category || 'Uncategorized';
            if (!acc[categoryKey]) acc[categoryKey] = [];
            acc[categoryKey].push(product);
            return acc;
        }, {});

        const categoryKeys = Object.keys(grouped).sort((a, b) => {
            if (a === 'Uncategorized') return 1;
            if (b === 'Uncategorized') return -1;
            return a.localeCompare(b);
        });

        drawHeader(true);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#475569');
        doc.text(`Products: ${data.length}`, margin, y);
        doc.text(`Category groups: ${categoryKeys.length}`, pageWidth - margin, y, { align: 'right' });
        y += 22;

        categoryKeys.forEach((categoryKey, categoryIndex) => {
            const categoryTitle = `${categoryIndex + 1}. ${categoryKey}`;
            if (y > pageHeight - margin - 120) {
                doc.addPage();
                drawHeader(false);
            }

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor('#1d4ed8');
            doc.text(categoryTitle, margin, y);
            y += 20;

            grouped[categoryKey].forEach((product, productIndex) => {
                const item = getProductDisplay(product);
                const title = `${productIndex + 1}. ${safeText(item.particulars)}`;
                const descriptionLines = doc.splitTextToSize(`Description: ${safeText(item.description)}`, contentWidth - 32);
                const detailsLines = doc.splitTextToSize(
                    `Qty: ${safeText(item.qty)} | Rate: ₹${fmt(item.rate)} | CGST: ₹${fmt(item.cgstAmt)} | SGST: ₹${fmt(item.sgstAmt)}`,
                    contentWidth - 32,
                );
                const cardHeight = 24 + descriptionLines.length * lineHeight + detailsLines.length * lineHeight + 14;

                if (y + cardHeight > pageHeight - margin - 40) {
                    doc.addPage();
                    drawHeader(false);
                }

                doc.setFillColor('#f8fafc');
                doc.roundedRect(margin, y - 6, contentWidth, cardHeight, 10, 10, 'F');
                doc.setDrawColor('#cbd5e1');
                doc.setLineWidth(0.8);
                doc.roundedRect(margin, y - 6, contentWidth, cardHeight, 10, 10, 'S');

                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor('#0f172a');
                doc.text(title, margin + 14, y + 12);

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor('#475569');
                doc.text(detailsLines, margin + 14, y + 30);
                doc.text(descriptionLines, margin + 14, y + 30 + detailsLines.length * lineHeight);

                y += cardHeight + 16;
            });
        });

        const totalPages = doc.getNumberOfPages();
        for (let pageIndex = 1; pageIndex <= totalPages; pageIndex += 1) {
            doc.setPage(pageIndex);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor('#94a3b8');
            doc.text(`Page ${pageIndex} of ${totalPages}`, pageWidth - margin, pageHeight - 24, { align: 'right' });
        }

        doc.save(`${fileName}.pdf`);
    };

    const handleCategorySelect = (category) => {
        setSearchParams(category ? { category } : {});
        setSelectedCategory(category);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this product?')) return;
        try {
            await deleteProduct(id);
            toast.success('Product deleted');
            loadProducts(selectedCategory);
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
                    {selectedCategory && <p style={S.categorySubtitle}>Showing category: {selectedCategory}</p>}
                </div>
                <div style={S.headerActions}>
                    <button type="button" onClick={() => exportProductPdf(selectedCategory, products)} style={S.exportBtn}>
                        ⬇ Download Catalogue PDF
                    </button>
                    <Link to="/products/new" style={S.addBtn}>+ Add Product</Link>
                </div>
            </div>

            <div style={S.body}>
                {categories.length > 0 && (
                    <div style={S.categoryFilters}>
                        <button
                            type="button"
                            onClick={() => handleCategorySelect('')}
                            style={selectedCategory === '' ? S.categoryPillActive : S.categoryPill}
                        >
                            All
                        </button>
                        {categories.map((category) => (
                            <button
                                type="button"
                                key={category._id}
                                onClick={() => handleCategorySelect(category.name)}
                                style={selectedCategory === category.name ? S.categoryPillActive : S.categoryPill}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                )}

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
                                            <button type="button" style={S.categoryChipButton} onClick={() => handleCategorySelect(item.category)}>
                                                {item.category}
                                            </button>
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
    exportBtn: {
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(16,185,129,0.12))',
        border: '1px solid rgba(34,197,94,0.24)',
        color: '#16a34a',
        padding: '9px 20px', borderRadius: '9px',
        fontWeight: 500, fontSize: '0.8rem', letterSpacing: '0.3px',
        cursor: 'pointer',
    },
    headerActions: { display: 'flex', gap: '10px', alignItems: 'center' },
    body: {
        display: 'flex', flexDirection: 'column', gap: '18px',
        maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: '8px',
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
        background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.3), transparent)',
    },
    cardBody: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' },
    prodName: { fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 },
    prodPrice: {
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '1.1rem', fontWeight: 600, color: '#3b82f6', flexShrink: 0,
    },
    categoryChip: {
        alignSelf: 'flex-start',
        background: 'rgba(52,211,153,0.08)', color: '#34d399',
        border: '1px solid rgba(52,211,153,0.15)',
        borderRadius: '20px', padding: '3px 10px',
        fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.5px',
    },
    categoryChipButton: {
        alignSelf: 'flex-start',
        background: 'rgba(52,211,153,0.08)', color: '#34d399',
        border: '1px solid rgba(52,211,153,0.15)',
        borderRadius: '20px', padding: '3px 10px',
        fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.5px',
        cursor: 'pointer',
        transition: 'background 0.2s, border-color 0.2s',
    },
    metaRow: { display: 'flex', alignItems: 'center', gap: '8px' },
    metaItem: { color: 'var(--text-muted)', fontSize: '0.75rem' },
    metaDot: { color: 'rgba(59,130,246,0.2)', fontSize: '0.7rem' },
    desc: { color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0, lineHeight: 1.5 },
    taxRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
    taxChip: {
        background: 'rgba(59,130,246,0.06)', color: 'rgba(59,130,246,0.5)',
        border: '1px solid rgba(59,130,246,0.1)',
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
    emptyIcon: { fontSize: '2rem', color: 'rgba(59,130,246,0.2)' },
    categorySubtitle: { margin: '8px 0 0', color: 'var(--text-muted)', fontSize: '0.76rem' },
    categoryFilters: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' },
    categoryPill: {
        appearance: 'none', border: '1px solid rgba(255,255,255,0.16)', borderRadius: '999px', background: 'transparent',
        color: 'var(--text-primary)', padding: '8px 14px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500,
    },
    categoryPillActive: {
        appearance: 'none', border: '1px solid var(--accent-button-border)', borderRadius: '999px', background: 'var(--accent-button-bg)',
        color: 'var(--gold)', padding: '8px 14px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
    },
    emptyText: { color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 },
};
