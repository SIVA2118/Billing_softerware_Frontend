import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { createCategory, deleteCategory, fetchCategories } from '../api/categoryApi.js';

export default function CategoryList() {
    const [categories, setCategories] = useState([]);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadCategories(); }, []);

    const loadCategories = async () => {
        try {
            const res = await fetchCategories();
            setCategories(res.data.data);
        } catch { toast.error('Failed to load categories'); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) { toast.error('Category name is required'); return; }
        setSaving(true);
        try {
            await createCategory({ name: name.trim() });
            toast.success('Category created');
            setName('');
            loadCategories();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this category?')) return;
        try {
            await deleteCategory(id);
            toast.success('Category deleted');
            loadCategories();
        } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    };

    return (
        <div className="page-shell" style={S.container}>
            <div style={S.header}>
                <h1 className="page-title-display" style={S.title}>Categories</h1>
                <p style={S.subtitle}>Organise products into categories</p>
            </div>
            <div className="split-layout" style={S.layout}>
                {/* Create form */}
                <div style={S.card}>
                    <div style={S.cardTopLine} />
                    <div style={S.cardInner}>
                        <div style={S.cardTitle}>New Category</div>
                        <form onSubmit={handleSubmit} style={S.form}>
                            <div style={S.field}>
                                <label style={S.label}>Category Name</label>
                                <input
                                    type="text" value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    style={S.input} placeholder="e.g. Grocery, Beverages"
                                    required
                                />
                            </div>
                            <button type="submit" disabled={saving} style={S.submitBtn}>
                                {saving ? 'Creating…' : '+ Create'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Category list */}
                <div style={S.card}>
                    <div style={S.cardTopLine} />
                    <div style={S.cardInner}>
                        <div style={S.cardHeaderRow}>
                            <div style={S.cardTitle}>All Categories</div>
                            <span style={S.countBadge}>{categories.length}</span>
                        </div>
                        {loading && <div style={S.stateText}>Loading…</div>}
                        {!loading && categories.length === 0 && (
                            <div style={S.stateText}>No categories yet.</div>
                        )}
                        {!loading && categories.length > 0 && (
                            <div style={S.list}>
                                {categories.map((cat) => (
                                    <div key={cat._id} style={S.listItem}>
                                        <div style={S.catIcon}>⊟</div>
                                        <span style={S.catName}>{cat.name}</span>
                                        <button onClick={() => handleDelete(cat._id)} style={S.deleteBtn}>Remove</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const S = {
    container: { maxWidth: '960px' },
    header: { marginBottom: '32px' },
    title: {
        margin: '0 0 4px',
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.5px',
    },
    subtitle: { margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem' },
    layout: { display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) 1fr', gap: '20px', alignItems: 'start' },
    card: {
        background: 'var(--surface-gradient)',
        borderRadius: '16px', border: '1px solid var(--line-soft)',
        overflow: 'hidden', boxShadow: 'var(--shadow-card)',
    },
    cardTopLine: { height: '1px', background: 'var(--top-line-gradient)' },
    cardInner: { padding: '24px' },
    cardTitle: { fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '20px' },
    cardHeaderRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' },
    countBadge: {
        background: 'rgba(201,168,76,0.08)', color: '#c9a84c',
        border: '1px solid rgba(201,168,76,0.15)',
        borderRadius: '20px', padding: '2px 10px', fontSize: '0.68rem', fontWeight: 600,
    },
    form: { display: 'flex', flexDirection: 'column', gap: '16px' },
    field: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '0.65rem', fontWeight: 600, color: 'color-mix(in srgb, var(--gold) 55%, transparent)', textTransform: 'uppercase', letterSpacing: '1.5px' },
    input: {
        padding: '12px 14px',
        background: 'var(--field-bg)', border: '1px solid var(--field-border)',
        borderRadius: '9px', fontSize: '0.85rem', color: 'var(--text-primary)', outline: 'none', width: '100%',
    },
    submitBtn: {
        padding: '11px', borderRadius: '9px',
        background: 'var(--accent-button-bg)',
        border: '1px solid var(--accent-button-border)', color: 'var(--gold)',
        fontWeight: 500, fontSize: '0.8rem', letterSpacing: '0.5px', cursor: 'pointer',
    },
    list: { display: 'flex', flexDirection: 'column', gap: '6px' },
    listItem: {
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 14px', borderRadius: '8px',
        border: '1px solid var(--muted-border)',
        background: 'color-mix(in srgb, var(--surface) 92%, transparent)',
    },
    catIcon: { fontSize: '0.75rem', color: 'rgba(201,168,76,0.3)', flexShrink: 0 },
    catName: { flex: 1, fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 400 },
    deleteBtn: {
        background: 'none', border: 'none',
        color: 'rgba(248,113,113,0.4)', fontSize: '0.72rem', fontWeight: 500,
        cursor: 'pointer', letterSpacing: '0.3px', flexShrink: 0,
    },
    stateText: { color: 'var(--text-muted)', fontSize: '0.82rem' },
};
