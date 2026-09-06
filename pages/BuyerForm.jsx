import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createBuyer, fetchBuyerById, updateBuyer } from '../api/buyerApi.js';
import { fetchRoutes } from '../api/routeApi.js';

const EMPTY_FORM = { name: '', address: '', route: '', phone: '' };

export default function BuyerForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    const [formData, setFormData] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [loadingBuyer, setLoadingBuyer] = useState(isEdit);
    const [routes, setRoutes] = useState([]);

    useEffect(() => {
        fetchRoutes()
            .then(res => setRoutes(res.data.data))
            .catch(() => toast.error('Failed to load routes'));
    }, []);

    useEffect(() => {
        if (!isEdit) return;
        fetchBuyerById(id)
            .then(res => {
                const b = res.data.data;
                setFormData({ name: b.name || '', address: b.address || '', route: b.route || '', phone: b.phone || '' });
            })
            .catch(() => toast.error('Failed to load buyer'))
            .finally(() => setLoadingBuyer(false));
    }, [id, isEdit]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) { toast.error('Buyer name is required'); return; }
        setSaving(true);
        try {
            if (isEdit) {
                await updateBuyer(id, { name: formData.name.trim(), address: formData.address.trim(), route: formData.route.trim(), phone: formData.phone.trim() });
                toast.success('Buyer updated');
            } else {
                await createBuyer({ name: formData.name.trim(), address: formData.address.trim(), route: formData.route.trim(), phone: formData.phone.trim() });
                toast.success('Buyer created');
            }
            navigate('/buyers');
        } catch (err) {
            toast.error(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} buyer`);
        } finally { setSaving(false); }
    };

    const set = (field) => (value) => setFormData(p => ({ ...p, [field]: value }));

    if (loadingBuyer) {
        return (
            <div className="page-shell" style={S.container}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading buyer…</p>
            </div>
        );
    }

    return (
        <div className="page-shell" style={S.container}>
            <div style={S.header}>
                <h1 className="page-title-display" style={S.title}>{isEdit ? 'Edit Buyer' : 'Add Buyer'}</h1>
                <p style={S.subtitle}>{isEdit ? 'Update buyer details' : 'Save buyer details for quick invoice creation'}</p>
            </div>
            <div style={S.card}>
                <div style={S.cardTopLine} />
                <div style={S.cardInner}>
                    <form onSubmit={handleSubmit} style={S.form}>

                        {/* Route — dropdown */}
                        <div style={S.field}>
                            <label htmlFor="route_name" style={S.label}>Route Name</label>
                                <div style={S.inputWrap}>
                                    <select
                                        id="route_name"
                                        name="route_name"
                                        value={formData.route}
                                        onChange={(e) => set('route')(e.target.value)}
                                        style={S.select}
                                    >
                                    <option value="" style={S.option}>— Select Route —</option>
                                    {routes.map(r => (
                                        <option key={r._id} value={r.name} style={S.option}>{r.name}</option>
                                    ))}
                                </select>
                                <span style={S.selectArrow}>▾</span>
                            </div>
                            {routes.length === 0 && (
                                <p style={S.routeHint}>
                                    No routes found.{' '}
                                    <button type="button" onClick={() => navigate('/buyers')} style={S.hintLink}>
                                        Create routes first ↗
                                    </button>
                                </p>
                            )}
                        </div>

                        <PremiumField label="Buyer Name" value={formData.name} onChange={set('name')} required placeholder="Full business or individual name" />
                        <PremiumField label="Address" value={formData.address} onChange={set('address')} placeholder="Street, locality" />
                        <PremiumField label="Phone" value={formData.phone} onChange={set('phone')} placeholder="+91 XXXXX XXXXX" />

                        <div className="form-actions" style={S.actions}>
                            <button type="button" onClick={() => navigate('/buyers')} style={S.cancelBtn}>Cancel</button>
                            <button type="submit" disabled={saving} style={S.submitBtn}>
                                {saving ? (isEdit ? 'Updating…' : 'Saving…') : (isEdit ? 'Update Buyer' : 'Create Buyer')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function PremiumField({ label, value, onChange, required, placeholder }) {
    const nm = String(label || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const lc = nm.toLowerCase();
    let auto = undefined;
    if (lc.includes('phone') || lc.includes('tel')) auto = 'tel';
    else if (lc.includes('address')) auto = 'street-address';
    else if (lc.includes('name')) auto = 'name';
    return (
        <div style={S.field}>
            <label htmlFor={nm} style={S.label}>{label}{required && <span style={S.req}> *</span>}</label>
            <input
                id={nm}
                name={nm}
                type="text" value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required} placeholder={placeholder || ''}
                style={S.input}
                autoComplete={auto}
            />
        </div>
    );
}

const S = {
    container: { maxWidth: '560px' },
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
    cardInner: { padding: '32px' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    field: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '0.65rem', fontWeight: 600, color: 'color-mix(in srgb, var(--gold) 60%, transparent)', textTransform: 'uppercase', letterSpacing: '1.5px' },
    req: { color: 'rgba(248,113,113,0.5)' },
    inputWrap: { position: 'relative' },
    select: {
        width: '100%', padding: '12px 40px 12px 16px',
        background: 'var(--field-bg)', border: '1px solid var(--field-border)',
        borderRadius: '10px', fontSize: '0.85rem', color: 'var(--text-primary)',
        outline: 'none', appearance: 'none', cursor: 'pointer',
        letterSpacing: '0.2px',
    },
    option: {
        background: '#ffffff',
        color: '#111111',
        fontSize: '0.85rem',
    },
    selectArrow: {
        position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
        color: 'var(--text-muted)', pointerEvents: 'none', fontSize: '0.8rem',
    },
    routeHint: { margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' },
    hintLink: {
        background: 'none', border: 'none', color: 'var(--gold)',
        fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline', padding: 0,
    },
    input: {
        padding: '12px 16px',
        background: 'var(--field-bg)', border: '1px solid var(--field-border)',
        borderRadius: '10px', fontSize: '0.85rem', color: 'var(--text-primary)',
        outline: 'none', width: '100%', letterSpacing: '0.2px',
    },
    actions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' },
    cancelBtn: {
        padding: '10px 20px', borderRadius: '9px',
        border: '1px solid rgba(255,255,255,0.06)', background: 'transparent',
        color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.8rem', letterSpacing: '0.3px', cursor: 'pointer',
    },
    submitBtn: {
        padding: '10px 24px', borderRadius: '9px',
        background: 'var(--accent-button-bg)',
        border: '1px solid var(--accent-button-border)', color: 'var(--gold)',
        fontWeight: 500, fontSize: '0.8rem', letterSpacing: '0.5px', cursor: 'pointer',
    },
};
