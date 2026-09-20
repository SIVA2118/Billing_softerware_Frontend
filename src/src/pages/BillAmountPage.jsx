import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { fetchInvoices } from '../api/invoiceApi';

function amountOf(items) {
    return items.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
}

function formatCurrency(value) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(value || 0);
}

function monthName(monthIndex) {
    return new Date(2026, monthIndex, 1).toLocaleDateString('en-IN', { month: 'short' });
}

function monthDateRange(year, monthIndex) {
    const start = new Date(year, monthIndex, 1);
    const end = new Date(year, monthIndex + 1, 0);
    const startText = start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const endText = end.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    return `${startText} - ${endText}`;
}

export default function BillAmountPage() {
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState([]);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                const res = await fetchInvoices();
                if (!mounted) return;
                setInvoices(Array.isArray(res.data?.data) ? res.data.data : []);
            } catch {
                toast.error('Failed to load bill details');
                if (mounted) setInvoices([]);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();
        return () => { mounted = false; };
    }, []);

    const data = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        const normalized = invoices.map((inv) => ({
            ...inv,
            _date: new Date(inv.invoiceDate),
            _amount: Number(inv.totalAmount || 0),
        })).filter((inv) => !Number.isNaN(inv._date.getTime()));

        const today = normalized.filter((inv) => inv._date >= startOfToday && inv._date < endOfToday);
        const month = normalized.filter((inv) => inv._date.getFullYear() === now.getFullYear() && inv._date.getMonth() === now.getMonth());
        const year = normalized.filter((inv) => inv._date.getFullYear() === now.getFullYear());

        const monthlyRows = Array.from({ length: 12 }, (_, index) => {
            const monthlyInvoices = normalized.filter((inv) => inv._date.getFullYear() === now.getFullYear() && inv._date.getMonth() === index);
            return {
                month: monthName(index),
                dateRange: monthDateRange(now.getFullYear(), index),
                count: monthlyInvoices.length,
                amount: amountOf(monthlyInvoices),
            };
        }).filter((row) => row.count > 0 || row.amount > 0);

        const recent = [...normalized]
            .sort((a, b) => b._date - a._date)
            .slice(0, 10);

        return {
            today,
            month,
            year,
            monthlyRows,
            recent,
        };
    }, [invoices]);

    if (loading) {
        return (
            <div style={S.loadingWrap}>
                <p style={S.loadingText}>Loading bill amount details...</p>
            </div>
        );
    }

    return (
        <div className="page-shell" style={S.page}>
            <div className="page-header" style={S.header}>
                <h1 className="page-title-display" style={S.title}>Bill Amount Details</h1>
                <p style={S.subtitle}>Track invoice totals by day, month and year</p>
            </div>

            <div style={S.cards}>
                <SummaryCard label="Today" amount={amountOf(data.today)} count={data.today.length} />
                <SummaryCard label="This Month" amount={amountOf(data.month)} count={data.month.length} />
                <SummaryCard label="This Year" amount={amountOf(data.year)} count={data.year.length} />
            </div>

            <div className="dashboard-grid" style={S.grid}>
                <section style={S.panel}>
                    <h2 style={S.panelTitle}>Month-wise Amount ({new Date().getFullYear()})</h2>
                    {data.monthlyRows.length === 0 ? (
                        <p style={S.empty}>No invoices this year.</p>
                    ) : (
                        <div className="table-scroll">
                            <table style={S.table}>
                                <thead>
                                    <tr>
                                        <th style={S.th}>Month</th>
                                        <th style={S.th}>Date</th>
                                        <th style={S.th}>Invoices</th>
                                        <th style={S.th}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.monthlyRows.map((row) => (
                                        <tr key={row.month}>
                                            <td style={S.td}>{row.month}</td>
                                            <td style={S.td}>{row.dateRange}</td>
                                            <td style={S.td}>{row.count}</td>
                                            <td style={S.td}>{formatCurrency(row.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section style={S.panel}>
                    <h2 style={S.panelTitle}>Recent Invoices</h2>
                    {data.recent.length === 0 ? (
                        <p style={S.empty}>No invoices available.</p>
                    ) : (
                        <div className="table-scroll">
                            <table style={S.table}>
                                <thead>
                                    <tr>
                                        <th style={S.th}>Invoice</th>
                                        <th style={S.th}>Date</th>
                                        <th style={S.th}>Buyer</th>
                                        <th style={S.th}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.recent.map((inv) => (
                                        <tr key={inv._id}>
                                            <td style={S.td}>{inv.invoiceNo}</td>
                                            <td style={S.td}>{inv._date.toLocaleDateString('en-IN')}</td>
                                            <td style={S.td}>{inv.buyer?.name || '-'}</td>
                                            <td style={S.td}>{formatCurrency(inv._amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

function SummaryCard({ label, amount, count }) {
    return (
        <div style={S.card}>
            <div style={S.cardLabel}>{label}</div>
            <div style={S.cardAmount}>{formatCurrency(amount)}</div>
            <div style={S.cardCount}>{count} invoice(s)</div>
        </div>
    );
}

const S = {
    page: { maxWidth: '1160px' },
    loadingWrap: { minHeight: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    loadingText: { color: 'var(--text-muted)', fontSize: '0.88rem' },
    header: { marginBottom: '24px' },
    title: {
        margin: '0 0 6px',
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '2rem',
        fontWeight: 600,
        color: 'var(--text-primary)',
    },
    subtitle: { margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.3px' },
    cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '18px' },
    card: {
        background: 'var(--surface-gradient)',
        border: '1px solid var(--line-medium)',
        borderRadius: '12px',
        padding: '16px 18px',
    },
    cardLabel: {
        fontSize: '0.66rem',
        color: 'rgba(59,130,246,0.65)',
        textTransform: 'uppercase',
        letterSpacing: '1.3px',
        marginBottom: '6px',
    },
    cardAmount: {
        color: 'var(--text-primary)',
        fontSize: '1.35rem',
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontWeight: 700,
        lineHeight: 1.1,
    },
    cardCount: { marginTop: '6px', color: 'var(--text-muted)', fontSize: '0.72rem' },
    grid: { display: 'grid', gridTemplateColumns: '1.1fr 1.4fr', gap: '16px' },
    panel: {
        background: 'var(--surface-gradient)',
        border: '1px solid var(--line-soft)',
        borderRadius: '14px',
        overflow: 'hidden',
    },
    panelTitle: {
        margin: 0,
        padding: '14px 16px',
        borderBottom: '1px solid var(--line-soft)',
        color: 'var(--text-primary)',
        fontSize: '0.9rem',
        letterSpacing: '0.3px',
    },
    empty: { margin: 0, padding: '18px 16px', color: 'var(--text-muted)', fontSize: '0.8rem' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: {
        textAlign: 'left',
        padding: '10px 16px',
        color: 'rgba(59,130,246,0.45)',
        fontSize: '0.63rem',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        borderBottom: '1px solid var(--table-row-border)',
        whiteSpace: 'nowrap',
    },
    td: {
        padding: '10px 16px',
        borderBottom: '1px solid var(--table-row-border)',
        color: 'var(--text-secondary)',
        fontSize: '0.8rem',
    },
};
