import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createBuyer } from '../api/buyerApi.js';

const EMPTY_FORM = { name: '', address: '', route: '', phone: '' };

export default function BuyerForm() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) { toast.error('Buyer name is required'); return; }
        setSaving(true);
        try {
            await createBuyer({ name: formData.name.trim(), address: formData.address.trim(), route: formData.route.trim(), phone: formData.phone.trim() });
            toast.success('Buyer created');
            navigate('/buyers');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create buyer');
        } finally { setSaving(false); }
    };

    const set = (field) => (value) => setFormData(p => ({ ...p, [field]: value }));

    return (
        <div className="page-shell" style={S.container}>
            <div style={S.header}>
                <h1 className="page-title-display" style={S.title}>Add Buyer</h1>
                <p style={S.subtitle}>Save buyer details for quick invoice creation</p>
            </div>
            <div style={S.card}>
                <div style={S.cardTopLine} />
                <div style={S.cardInner}>
                    <form onSubmit={handleSubmit} style={S.form}>
                        <PremiumField label="Buyer Name" value={formData.name} onChange={set('name')} required placeholder="Full business or individual name" />
                        <PremiumField label="Address" value={formData.address} onChange={set('address')} placeholder="Street, locality" />
                        <PremiumField label="Route" value={formData.route} onChange={set('route')} placeholder="Delivery route" />
                        <PremiumField label="Phone" value={formData.phone} onChange={set('phone')} placeholder="+91 XXXXX XXXXX" />
                        <div className="form-actions" style={S.actions}>
                            <button type="button" onClick={() => navigate('/buyers')} style={S.cancelBtn}>Cancel</button>
                            <button type="submit" disabled={saving} style={S.submitBtn}>
                                {saving ? 'Saving…' : 'Create Buyer'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function PremiumField({ label, value, onChange, required, placeholder }) {
    return (
        <div style={S.field}>
            <label style={S.label}>{label}{required && <span style={S.req}> *</span>}</label>
            <input
                type="text" value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required} placeholder={placeholder || ''}
                style={S.input}
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
