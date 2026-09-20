import React from 'react';
import qrImage from '../../image/QR.jpeg';

export default function QrPage() {
    return (
        <div className="page-shell" style={S.container}>
            <div className="page-header" style={S.header}>
                <div>
                    <h1 className="page-title-display" style={S.title}>Payment QR</h1>
                    <p style={S.subtitle}>Scan and pay with any UPI app</p>
                </div>
            </div>
            <div style={S.card}>
                <img src={qrImage} alt="Payment QR code for Shri Vaari and Co" style={S.image} />
            </div>
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
        display: 'flex', justifyContent: 'center', padding: '24px',
        background: 'var(--surface-gradient)', border: '1px solid var(--line-medium)',
        borderRadius: '16px', boxShadow: 'var(--shadow-card)',
    },
    image: {
        display: 'block', width: '100%', maxWidth: '480px', maxHeight: 'calc(100vh - 190px)',
        objectFit: 'contain', borderRadius: '8px',
    },
};
