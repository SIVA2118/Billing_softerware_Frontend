import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../api/baseUrl';

export default function LoginPage({ onThemeToggle, setToken, setUser, theme }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/login`, { username, password });
            const token = res.data.token;
            const user = res.data.user;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user || null));
            setToken(token);
            setUser(user || null);
            toast.success('Welcome back');
            navigate('/');
        } catch (err) {
            const message = err.response?.data?.message || (err.request ? 'Unable to reach server' : 'Authentication failed');
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page" style={S.page}>
            {/* Ambient BG effects */}
            <div style={S.ambientLeft} />
            <div style={S.ambientRight} />
            <button type="button" style={S.themeBtn} onClick={onThemeToggle}>
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>

            {/* Left — branding */}
            <div className="login-left" style={S.left}>
                <div style={S.brandBlock}>
                    <div style={S.logoContainer}>
                        <div style={S.logoRing} />
                        <div style={S.logoInner}>₹</div>
                    </div>
                    <h1 style={S.appName}>BillFlow</h1>
                    <p style={S.tagline}>Professional invoicing and client management for modern businesses.</p>
                    <div style={S.divider} />
                    <div style={S.features}>
                        {[
                            ['◈', 'Smart invoice generation with auto-tax'],
                            ['⬡', 'Product catalogue & stock management'],
                            ['◉', 'Client CRM with route tracking'],
                            ['⊟', 'Detailed financial summaries'],
                        ].map(([icon, text]) => (
                            <div key={text} style={S.featureItem}>
                                <span style={S.featureIcon}>{icon}</span>
                                <span style={S.featureText}>{text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right — login */}
            <div className="login-right" style={S.right}>
                <div className="login-card" style={S.card}>
                    {/* Card top accent line */}
                    <div style={S.cardAccent} />

                    <div style={S.cardInner}>
                        <div style={S.cardHeader}>
                            <h2 style={S.title}>Sign In</h2>
                            <p style={S.subtitle}>Access your BillFlow account</p>
                        </div>

                        <form onSubmit={handleLogin} style={S.form}>
                            <div style={S.field}>
                                <label style={S.label}>Username</label>
                                <div style={S.inputWrap}>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        style={S.input}
                                        placeholder="Enter username"
                                        required
                                    />
                                </div>
                            </div>
                            <div style={S.field}>
                                <label style={S.label}>Password</label>
                                <div style={S.inputWrap}>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        style={S.input}
                                        placeholder="••••••••••"
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} style={{ ...S.button, ...(loading ? S.buttonLoading : {}) }}>
                                {loading ? (
                                    <span style={S.btnContent}>
                                        <span style={S.loadingDot}>●</span> Signing in…
                                    </span>
                                ) : (
                                    <span style={S.btnContent}>
                                        Sign In <span style={S.btnArrow}>→</span>
                                    </span>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

const S = {
    page: {
        display: 'flex', minHeight: '100vh', width: '100%',
        background: 'var(--obsidian)',
        position: 'relative', overflow: 'hidden',
    },
    ambientLeft: {
        position: 'absolute', top: '-30%', left: '-10%',
        width: '60%', height: '80%',
        background: 'radial-gradient(ellipse, var(--page-glow-left) 0%, transparent 65%)',
        pointerEvents: 'none',
    },
    ambientRight: {
        position: 'absolute', bottom: '-20%', right: '-5%',
        width: '45%', height: '60%',
        background: 'radial-gradient(ellipse, var(--page-glow-right) 0%, transparent 65%)',
        pointerEvents: 'none',
    },
    themeBtn: {
        position: 'absolute',
        top: '24px',
        right: '24px',
        zIndex: 2,
        padding: '10px 14px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--line-strong)',
        color: 'var(--text-secondary)',
        borderRadius: '10px',
        fontSize: '0.78rem',
        fontWeight: 500,
        backdropFilter: 'blur(16px)',
    },
    left: {
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '60px 80px',
        borderRight: '1px solid var(--line-soft)',
        position: 'relative',
    },
    brandBlock: { maxWidth: '420px' },
    logoContainer: {
        position: 'relative', width: '72px', height: '72px', marginBottom: '32px',
    },
    logoRing: {
        position: 'absolute', inset: 0,
        border: '1px solid var(--accent-button-border)',
        borderRadius: '18px',
        background: 'var(--accent-chip-bg)',
        boxShadow: 'var(--shadow-gold)',
    },
    logoInner: {
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '2rem', fontWeight: 700, color: '#c9a84c',
    },
    appName: {
        margin: '0 0 12px',
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '3rem', fontWeight: 600, letterSpacing: '1px',
        color: 'var(--text-primary)',
        lineHeight: 1.1,
    },
    tagline: {
        margin: '0 0 36px', color: 'var(--text-muted)',
        fontSize: '0.92rem', lineHeight: 1.7, fontWeight: 300,
    },
    divider: {
        height: '1px', marginBottom: '32px',
        background: 'linear-gradient(90deg, var(--accent-button-border), transparent)',
    },
    features: { display: 'flex', flexDirection: 'column', gap: '16px' },
    featureItem: { display: 'flex', alignItems: 'center', gap: '14px' },
    featureIcon: { fontSize: '0.85rem', color: '#c9a84c', opacity: 0.7, width: '18px', textAlign: 'center', flexShrink: 0 },
    featureText: { color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 300, letterSpacing: '0.2px' },
    right: {
        width: '460px', minWidth: '400px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '60px 48px',
        background: 'color-mix(in srgb, var(--surface) 62%, transparent)',
        position: 'relative',
    },
    card: {
        width: '100%', maxWidth: '380px',
        background: 'var(--surface-gradient)',
        borderRadius: '20px',
        border: '1px solid var(--line-medium)',
        boxShadow: 'var(--shadow-raised)',
        overflow: 'hidden',
    },
    cardAccent: {
        height: '2px',
        background: 'var(--top-line-gradient)',
    },
    cardInner: { padding: '40px 36px' },
    cardHeader: { marginBottom: '32px' },
    title: {
        margin: '0 0 8px',
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.5px',
    },
    subtitle: { margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.3px' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    field: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: {
        fontSize: '0.68rem', fontWeight: 600,
        color: 'color-mix(in srgb, var(--gold) 70%, transparent)',
        textTransform: 'uppercase', letterSpacing: '1.5px',
    },
    inputWrap: { position: 'relative' },
    input: {
        width: '100%', padding: '13px 16px',
        background: 'var(--field-bg)',
        border: '1px solid var(--field-border)',
        borderRadius: '10px',
        fontSize: '0.88rem', color: 'var(--text-primary)',
        outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        letterSpacing: '0.2px',
    },
    button: {
        padding: '14px',
        background: 'var(--accent-button-bg)',
        border: '1px solid var(--accent-button-border)',
        borderRadius: '10px',
        color: 'var(--gold)',
        fontWeight: 500, fontSize: '0.88rem',
        letterSpacing: '0.5px',
        cursor: 'pointer',
        marginTop: '8px',
        transition: 'all 0.2s',
        boxShadow: 'var(--shadow-gold)',
    },
    buttonLoading: { opacity: 0.6, cursor: 'not-allowed' },
    btnContent: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
    btnArrow: { fontSize: '1rem', opacity: 0.7 },
    loadingDot: { fontSize: '0.5rem', opacity: 0.6 },
};
