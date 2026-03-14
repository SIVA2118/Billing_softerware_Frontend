import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchProduct, createProduct, updateProduct } from '../api/productApi';
import { fetchCategories } from '../api/categoryApi.js';
import toast from 'react-hot-toast';

const DEFAULT = {
    particulars: '',
    category: '',
    qty: '',
    rate: '',
    grossAmt: '0.00',
    cgstPct: '9',
    cgstAmt: '0.00',
    sgstPct: '9',
    sgstAmt: '0.00',
    entryDate: new Date().toISOString().slice(0, 10),
    expiryDate: '',
    description: '',
};
const toNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const fmt = (v) => toNum(v).toFixed(2);

const compute = (d) => {
    const gross = toNum(d.qty) * toNum(d.rate);
    const cgst = (gross * toNum(d.cgstPct)) / 100;
    const sgst = (gross * toNum(d.sgstPct)) / 100;
    return { ...d, grossAmt: fmt(gross), cgstAmt: fmt(cgst), sgstAmt: fmt(sgst) };
};

const normalize = (p) => compute({
    particulars: p.particulars || p.name || '',
    category: p.category || '',
    qty: p.qty ? String(p.qty) : '',
    rate: p.rate ?? p.unitPrice ?? '',
    grossAmt: p.grossAmt ?? '0.00',
    cgstPct: String(p.cgstPct ?? ((p.taxRate ?? 18) / 2)),
    cgstAmt: p.cgstAmt ?? '0.00',
    sgstPct: String(p.sgstPct ?? ((p.taxRate ?? 18) / 2)),
    sgstAmt: p.sgstAmt ?? '0.00',
    entryDate: p.entryDate ? String(p.entryDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
    expiryDate: p.expiryDate ? String(p.expiryDate).slice(0, 10) : '',
    description: p.description || '',
});

export default function ProductForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState(DEFAULT);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCategories().then(r => setCategories(r.data.data)).catch(() => toast.error('Failed to load categories'));
        if (id) fetchProduct(id).then(r => setForm(normalize(r.data.data))).catch(() => toast.error('Failed to load product'));
    }, [id]);

    const set = (field, val) => setForm(p => compute({ ...p, [field]: val }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const payload = {
            particulars: form.particulars.trim(), category: form.category.trim(),
            qty: form.qty, rate: toNum(form.rate), grossAmt: toNum(form.grossAmt),
            cgstPct: toNum(form.cgstPct), cgstAmt: toNum(form.cgstAmt),
            sgstPct: toNum(form.sgstPct), sgstAmt: toNum(form.sgstAmt),
            entryDate: form.entryDate || null,
            expiryDate: form.expiryDate || null,
            description: form.description.trim(),
        };
        try {
            if (id) { await updateProduct(id, payload); toast.success('Product updated'); }
            else { await createProduct(payload); toast.success('Product added'); }
            navigate('/products');
        } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
        finally { setLoading(false); }
    };

    return (
        <div className="page-shell" style={S.container}>
            <div style={S.header}>
                <h1 className="page-title-display" style={S.title}>{id ? 'Edit Product' : 'Add Product'}</h1>
                <p style={S.subtitle}>{id ? 'Update product details' : 'Add a new product to catalogue'}</p>
            </div>
            <div style={S.card}>
                <div style={S.cardTopLine} />
                <div style={S.cardInner}>
                    <form onSubmit={handleSubmit} style={S.form}>
                        <FField label="Particulars" value={form.particulars} onChange={v => set('particulars', v)} required placeholder="e.g. Coconut Oil 1L" />
                        <div style={S.field}>
                            <label style={S.label}>Category</label>
                            <select style={S.selectInp} value={form.category} onChange={e => set('category', e.target.value)}>
                                <option value="" style={S.selectOptionMuted}>— Select category —</option>
                                {categories.map(c => <option key={c._id} value={c.name} style={S.selectOption}>{c.name}</option>)}
                            </select>
                            <div style={S.helperRow}>
                                <Link to="/categories" style={S.helperLink}>Manage categories →</Link>
                            </div>
                        </div>
                        <div className="form-row" style={S.row}>
                            <FField label="Qty" value={form.qty} onChange={v => set('qty', v)} type="number" required placeholder="0" />
                            <FField label="Rate (₹)" value={form.rate} onChange={v => set('rate', v)} type="number" required placeholder="0.00" />
                        </div>
                        <div className="form-row" style={S.row}>
                            <ReadField label="Gross Amount (₹)" value={form.grossAmt} />
                            <FField label="CGST %" value={form.cgstPct} onChange={v => set('cgstPct', v)} type="number" required />
                        </div>
                        <div className="form-row" style={S.row}>
                            <ReadField label="CGST Amount (₹)" value={form.cgstAmt} />
                            <FField label="SGST %" value={form.sgstPct} onChange={v => set('sgstPct', v)} type="number" required />
                        </div>
                        <div className="form-row" style={S.row}>
                            <ReadField label="SGST Amount (₹)" value={form.sgstAmt} />
                            <FField label="Entry Date" value={form.entryDate} onChange={v => set('entryDate', v)} type="date" />
                        </div>
                        <div style={S.row}>
                            <FField label="Expiry Date" value={form.expiryDate} onChange={v => set('expiryDate', v)} type="date" />
                            <div style={S.field}>
                                <label style={S.label}>Description</label>
                                <textarea value={form.description} onChange={e => set('description', e.target.value)} style={{ ...S.inp, height: '80px', resize: 'vertical' }} placeholder="Optional description" />
                            </div>
                        </div>

                        {/* Preview total */}
                        <div style={S.totalPreview}>
                            <span style={S.totalPreviewLabel}>Total Value</span>
                            <span style={S.totalPreviewVal}>₹{fmt(toNum(form.grossAmt) + toNum(form.cgstAmt) + toNum(form.sgstAmt))}</span>
                        </div>

                        <div className="form-actions" style={S.actions}>
                            <button type="button" onClick={() => navigate('/products')} style={S.cancelBtn}>Cancel</button>
                            <button type="submit" disabled={loading} style={S.submitBtn}>
                                {loading ? 'Saving…' : id ? 'Update Product' : 'Add to Catalogue'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function FField({ label, value, onChange, type = 'text', required, placeholder = '' }) {
    return (
        <div style={S.field}>
            <label style={S.label}>{label}{required && <span style={{ color: 'rgba(248,113,113,0.5)' }}> *</span>}</label>
            <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required} style={S.inp} min={type === 'number' ? '0' : undefined} step={type === 'number' ? '0.01' : undefined} />
        </div>
    );
}

function ReadField({ label, value }) {
    return (
        <div style={S.field}>
            <label style={S.label}>{label}</label>
            <input type="number" value={value} readOnly style={S.readInp} />
        </div>
    );
}

const S = {
    container: { maxWidth: '620px' },
    header: { marginBottom: '28px' },
    title: {
        margin: '0 0 4px',
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.5px',
    },
    subtitle: { margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem' },
    card: {
        background: 'var(--surface-gradient)',
        borderRadius: '16px', border: '1px solid var(--line-medium)',
        overflow: 'hidden', boxShadow: 'var(--shadow-card)',
    },
    cardTopLine: { height: '1px', background: 'var(--top-line-gradient)' },
    cardInner: { padding: '28px' },
    form: { display: 'flex', flexDirection: 'column', gap: '18px' },
    field: { display: 'flex', flexDirection: 'column', gap: '7px', flex: 1 },
    label: { fontSize: '0.62rem', fontWeight: 600, color: 'color-mix(in srgb, var(--gold) 55%, transparent)', textTransform: 'uppercase', letterSpacing: '1.5px' },
    inp: {
        padding: '11px 13px', width: '100%',
        background: 'var(--field-bg)', border: '1px solid var(--field-border)',
        borderRadius: '9px', fontSize: '0.84rem', color: 'var(--text-primary)', outline: 'none',
    },
    selectInp: {
        padding: '11px 13px', width: '100%',
        background: 'var(--field-bg)', border: '1px solid var(--field-border)',
        borderRadius: '9px', fontSize: '0.84rem', color: 'var(--text-primary)', outline: 'none',
    },
    selectOption: {
        color: '#1f2433',
        background: '#ffffff',
    },
    selectOptionMuted: {
        color: '#6b7280',
        background: '#ffffff',
    },
    readInp: {
        padding: '11px 13px', width: '100%',
        background: 'color-mix(in srgb, var(--gold) 6%, transparent)', border: '1px solid var(--line-soft)',
        borderRadius: '9px', fontSize: '0.84rem', color: 'color-mix(in srgb, var(--gold) 75%, transparent)', outline: 'none',
    },
    helperRow: { marginTop: '4px' },
    helperLink: { fontSize: '0.7rem', color: 'color-mix(in srgb, var(--gold) 60%, transparent)', fontWeight: 500 },
    row: { display: 'flex', gap: '14px' },
    totalPreview: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px',
        background: 'var(--gold-dim)', border: '1px solid var(--line-medium)',
        borderRadius: '10px',
    },
    totalPreviewLabel: { fontSize: '0.65rem', fontWeight: 700, color: 'color-mix(in srgb, var(--gold) 60%, transparent)', textTransform: 'uppercase', letterSpacing: '1.5px' },
    totalPreviewVal: { fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.1rem', fontWeight: 600, color: 'var(--gold)' },
    actions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' },
    cancelBtn: {
        padding: '10px 20px', borderRadius: '9px',
        background: 'transparent', border: '1px solid var(--muted-border)',
        color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.8rem', letterSpacing: '0.3px', cursor: 'pointer',
    },
    submitBtn: {
        padding: '10px 24px', borderRadius: '9px',
        background: 'var(--accent-button-bg)',
        border: '1px solid var(--accent-button-border)', color: 'var(--gold)',
        fontWeight: 500, fontSize: '0.8rem', letterSpacing: '0.5px', cursor: 'pointer',
    },
};
