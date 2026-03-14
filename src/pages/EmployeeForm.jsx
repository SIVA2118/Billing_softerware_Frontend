import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createEmployee } from '../api/authApi';

export default function EmployeeForm() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.username.trim()) {
            toast.error('Username is required');
            return;
        }
        if ((formData.password || '').length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setSaving(true);
        try {
            const res = await createEmployee({
                username: formData.username.trim(),
                password: formData.password,
            });
            const generatedId = res.data?.data?.employeeId;
            toast.success(generatedId ? `Employee added successfully (${generatedId})` : 'Employee added successfully');
            setFormData({ username: '', password: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add employee');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page-shell" style={S.container}>
            <div style={S.header}>
                <h1 className="page-title-display" style={S.title}>Add Employee</h1>
                <p style={S.subtitle}>Create a login account for employee access</p>
            </div>

            <div style={S.card}>
                <div style={S.cardTopLine} />
                <div style={S.cardInner}>
                    <form onSubmit={handleSubmit} style={S.form}>
                        <div style={S.field}>
                            <label style={S.label}>Username <span style={S.req}>*</span></label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData((p) => ({ ...p, username: e.target.value }))}
                                required
                                style={S.input}
                                placeholder="employee_username"
                            />
                        </div>

                        <div style={S.field}>
                            <label style={S.label}>Password <span style={S.req}>*</span></label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                                required
                                minLength={6}
                                style={S.input}
                                placeholder="Minimum 6 characters"
                            />
                        </div>

                        <div className="form-actions" style={S.actions}>
                            <button type="button" onClick={() => navigate('/')} style={S.cancelBtn}>Cancel</button>
                            <button type="submit" disabled={saving} style={S.submitBtn}>
                                {saving ? 'Saving...' : 'Add Employee'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
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
    req: { color: 'rgba(248,113,113,0.7)' },
    input: {
        padding: '12px 16px',
        background: 'var(--field-bg)', border: '1px solid var(--field-border)',
        borderRadius: '10px', fontSize: '0.85rem', color: 'var(--text-primary)',
        outline: 'none', width: '100%', letterSpacing: '0.2px',
    },
    actions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' },
    cancelBtn: {
        padding: '10px 20px', borderRadius: '9px',
        border: '1px solid var(--muted-border)', background: 'transparent',
        color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.8rem', letterSpacing: '0.3px', cursor: 'pointer',
    },
    submitBtn: {
        padding: '10px 24px', borderRadius: '9px',
        background: 'var(--accent-button-bg)',
        border: '1px solid var(--accent-button-border)', color: 'var(--gold)',
        fontWeight: 500, fontSize: '0.8rem', letterSpacing: '0.5px', cursor: 'pointer',
    },
};
