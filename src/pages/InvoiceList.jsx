import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fetchInvoices, deleteInvoice } from '../api/invoiceApi';

export default function InvoiceList() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(25);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const navigate = useNavigate();
    const location = useLocation();

    const currentUser = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();
    const isEmployee = currentUser?.role === 'employee';

    const buyerFilter = new URLSearchParams(location.search).get('buyer') || '';
    const employeeFilter = new URLSearchParams(location.search).get('employee') || '';

    const filteredInvoices = invoices;

    const load = async () => {
        try {
            setLoading(true);
            const effectiveEmployeeFilter = isEmployee ? (currentUser?.employeeId || '') : employeeFilter;
            const res = await fetchInvoices({
                paginate: 1,
                page,
                limit: pageSize,
                buyer: buyerFilter || undefined,
                employee: effectiveEmployeeFilter || undefined,
            });

            const rows = res.data?.data || [];
            const pagination = res.data?.pagination || {};

            setInvoices(rows);
            setTotalRecords(Number(pagination.total || rows.length || 0));
            setTotalPages(Number(pagination.totalPages || 1));
        } catch {
            toast.error('Failed to load invoices');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
    }, [buyerFilter, employeeFilter, isEmployee, currentUser?.employeeId]);

    useEffect(() => { load(); }, [page, pageSize, buyerFilter, employeeFilter, isEmployee, currentUser?.employeeId]);

    const handleDelete = async (id, invoiceNo) => {
        if (!window.confirm(`Delete invoice ${invoiceNo}?`)) return;
        try {
            await deleteInvoice(id);
            toast.success('Invoice deleted');
            load();
        } catch {
            toast.error('Delete failed');
        }
    };

    const handlePrint = (id) => {
        window.open(`/invoice/${id}?print=1`, '_blank', 'noopener,noreferrer');
    };

    if (loading) return (
        <div style={S.loadingState}>
            <div style={S.loadingText}>Loading invoices…</div>
        </div>
    );

    const totalRevenue = filteredInvoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
    const totalTax = filteredInvoices.reduce((s, i) => s + (i.totalTax || 0), 0);

    return (
        <div className="page-shell" style={S.page}>
            {/* Page Header */}
            <div className="page-header" style={S.pageHeader}>
                <div>
                    <h1 className="page-title-display" style={S.pageTitle}>
                        {buyerFilter ? `${buyerFilter}'s Invoices` : employeeFilter ? `${employeeFilter} — Bills` : isEmployee ? 'My Invoices' : 'All Invoices'}
                    </h1>
                    <p style={S.pageSub}>
                        {totalRecords} record{totalRecords !== 1 ? 's' : ''}
                        {buyerFilter ? ` · filtered by buyer` : employeeFilter ? ` · filtered by employee` : isEmployee ? ` · your bills` : ''}
                    </p>
                </div>
                <div className="page-header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {(buyerFilter || employeeFilter) && (
                        <button onClick={() => navigate('/')} style={S.btnClear}>✕ Clear</button>
                    )}
                    <Link to="/new" style={S.btnCreate}>
                        <span style={S.btnCreateIcon}>+</span> New Invoice
                    </Link>
                </div>
            </div>

            {/* Stat Cards */}
            <div style={S.statsGrid}>
                <StatCard
                    label="Total Invoices"
                    value={totalRecords}
                    accent="#c9a84c"
                    icon="◈"
                />
                <StatCard
                    label="Total Revenue"
                    value={`₹${totalRevenue.toLocaleString('en-IN')}`}
                    accent="#34d399"
                    icon="₹"
                />
                <StatCard
                    label="Tax Collected"
                    value={`₹${totalTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                    accent="#fbbf24"
                    icon="%"
                />
            </div>

            {/* Table */}
            <div style={S.tableContainer}>
                {filteredInvoices.length === 0 ? (
                    <div style={S.emptyState}>
                        <div style={S.emptyIcon}>◈</div>
                        <p style={S.emptyText}>
                            {buyerFilter ? `No invoices for "${buyerFilter}"` : employeeFilter ? `No invoices found for employee "${employeeFilter}"` : 'No invoices yet. Create your first one.'}
                        </p>
                        <Link to="/new" style={S.btnCreate}>+ Create Invoice</Link>
                    </div>
                ) : (
                    <div className="table-scroll">
                        <table style={S.table}>
                            <thead>
                                <tr>
                                    {['Invoice No', 'Date', 'Buyer', 'Emp ID', 'Items', 'Net Amt', 'Tax', 'Total', ''].map(h => (
                                        <th key={h} style={S.th}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInvoices.map((inv, idx) => (
                                    <tr key={inv._id} style={{ ...S.tr, animationDelay: `${idx * 30}ms` }}>
                                        <td style={S.td}>
                                            <span style={S.invoBadge}>{inv.invoiceNo}</span>
                                        </td>
                                        <td style={S.td}>
                                            <span style={S.dateText}>
                                                {new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                                            </span>
                                        </td>
                                        <td style={S.td}>
                                            <span style={S.buyerName}>{inv.buyer?.name || '—'}</span>
                                        </td>
                                        <td style={S.td}>
                                            <span style={S.empIdChip}>{inv.employeeId || inv.Adminid || '—'}</span>
                                        </td>
                                        <td style={S.td}>
                                            <span style={S.countBadge}>{inv.items?.length}</span>
                                        </td>
                                        <td style={S.td}>
                                            <span style={S.amtText}>₹{(inv.netAmount || 0).toFixed(2)}</span>
                                        </td>
                                        <td style={S.td}>
                                            <span style={S.taxText}>₹{(inv.totalTax || 0).toFixed(2)}</span>
                                        </td>
                                        <td style={S.td}>
                                            <span style={S.totalAmt}>₹{(inv.totalAmount || 0).toLocaleString('en-IN')}</span>
                                        </td>
                                        <td style={S.td}>
                                            <div className="inline-actions" style={S.actions}>
                                                <button onClick={() => navigate(`/invoice/${inv._id}`)} style={S.btnView}>View</button>
                                                <button onClick={() => handlePrint(inv._id)} style={S.btnPrint}>Print</button>
                                                <button onClick={() => navigate(`/edit/${inv._id}`)} style={S.btnEdit}>Edit</button>
                                                <button onClick={() => handleDelete(inv._id, inv.invoiceNo)} style={S.btnDel}>✕</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="toolbar-row" style={S.paginationBar}>
                    <button
                        style={{ ...S.pageBtn, ...(page <= 1 ? S.pageBtnDisabled : {}) }}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                    >
                        Previous
                    </button>
                    <span style={S.pageInfo}>Page {page} of {totalPages}</span>
                    <button
                        style={{ ...S.pageBtn, ...(page >= totalPages ? S.pageBtnDisabled : {}) }}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, accent, icon }) {
    return (
        <div style={{ ...S.statCard, '--accent': accent }}>
            <div style={{ ...S.statIconBox, background: `rgba(${hexToRgb(accent)}, 0.08)`, border: `1px solid rgba(${hexToRgb(accent)}, 0.15)` }}>
                <span style={{ ...S.statIcon, color: accent }}>{icon}</span>
            </div>
            <div>
                <div style={{ ...S.statValue, color: accent }}>{value}</div>
                <div style={S.statLabel}>{label}</div>
            </div>
        </div>
    );
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1],16)},${parseInt(result[2],16)},${parseInt(result[3],16)}` : '255,255,255';
}

const S = {
    page: { maxWidth: '1160px' },
    loadingState: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' },
    loadingText: { color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.5px' },
    pageHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        marginBottom: '32px',
    },
    pageTitle: {
        margin: '0 0 4px',
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.5px',
        lineHeight: 1.2,
    },
    pageSub: { margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem', letterSpacing: '0.3px' },
    btnCreate: {
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        background: 'var(--accent-button-bg)',
        border: '1px solid var(--accent-button-border)',
        color: 'var(--gold)', padding: '9px 20px', borderRadius: '9px',
        fontWeight: 500, fontSize: '0.8rem', letterSpacing: '0.3px',
        textDecoration: 'none',
        transition: 'all 0.2s',
        boxShadow: 'var(--shadow-gold)',
    },
    btnCreateIcon: { fontSize: '1.1rem', fontWeight: 300 },
    btnClear: {
        background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)',
        color: 'rgba(248,113,113,0.7)', padding: '9px 14px', borderRadius: '9px',
        fontWeight: 500, fontSize: '0.78rem', letterSpacing: '0.3px',
        cursor: 'pointer',
    },
    statsGrid: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px', marginBottom: '28px',
    },
    statCard: {
        background: 'var(--surface-gradient)',
        border: '1px solid var(--muted-border)',
        borderRadius: '14px', padding: '22px 24px',
        display: 'flex', alignItems: 'center', gap: '18px',
        boxShadow: 'var(--shadow-card)',
    },
    statIconBox: {
        width: '48px', height: '48px', borderRadius: '12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    statIcon: { fontSize: '1.1rem', fontWeight: 400 },
    statValue: {
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '1.55rem', fontWeight: 600, lineHeight: 1.1, letterSpacing: '0.5px',
    },
    statLabel: { color: 'var(--text-muted)', fontSize: '0.7rem', letterSpacing: '0.8px', textTransform: 'uppercase', marginTop: '3px' },
    tableContainer: {
        background: 'var(--surface-gradient)',
        borderRadius: '16px',
        border: '1px solid var(--line-soft)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: {
        padding: '14px 18px',
        background: 'color-mix(in srgb, var(--gold) 7%, transparent)',
        borderBottom: '1px solid var(--line-soft)',
        textAlign: 'left', fontSize: '0.62rem', fontWeight: 600,
        color: 'color-mix(in srgb, var(--gold) 55%, transparent)', letterSpacing: '1.5px', textTransform: 'uppercase',
        whiteSpace: 'nowrap',
    },
    tr: {
        borderBottom: '1px solid var(--table-row-border)',
        transition: 'background 0.15s',
    },
    td: {
        padding: '14px 18px', verticalAlign: 'middle',
        color: 'var(--text-secondary)', fontSize: '0.82rem',
    },
    invoBadge: {
        background: 'rgba(201,168,76,0.08)', color: '#c9a84c',
        border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: '6px', padding: '4px 10px',
        fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.3px',
    },
    dateText: { color: 'var(--text-muted)', fontSize: '0.78rem' },
    buyerName: { color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.83rem' },
    empIdChip: {
        background: 'rgba(167,139,250,0.08)', color: '#a78bfa',
        border: '1px solid rgba(167,139,250,0.18)',
        borderRadius: '6px', padding: '3px 9px',
        fontWeight: 600, fontSize: '0.72rem', letterSpacing: '0.3px',
    },
    countBadge: {
        background: 'rgba(125,211,252,0.08)', color: '#7dd3fc',
        borderRadius: '20px', padding: '2px 10px',
        fontSize: '0.72rem', fontWeight: 600,
    },
    amtText: { color: 'var(--text-secondary)' },
    taxText: { color: '#fbbf24', opacity: 0.8, fontWeight: 500 },
    totalAmt: { color: '#34d399', fontWeight: 600, fontSize: '0.88rem' },
    actions: { display: 'flex', gap: '6px' },
    btnView: {
        background: 'rgba(201,168,76,0.08)', color: '#c9a84c',
        border: '1px solid rgba(201,168,76,0.15)',
        padding: '5px 12px', borderRadius: '6px',
        fontSize: '0.72rem', fontWeight: 500, cursor: 'pointer',
        letterSpacing: '0.3px',
    },
    btnEdit: {
        background: 'rgba(251,191,36,0.08)', color: '#fbbf24',
        border: '1px solid rgba(251,191,36,0.15)',
        padding: '5px 12px', borderRadius: '6px',
        fontSize: '0.72rem', fontWeight: 500, cursor: 'pointer',
    },
    btnPrint: {
        background: 'rgba(125,211,252,0.08)', color: '#7dd3fc',
        border: '1px solid rgba(125,211,252,0.15)',
        padding: '5px 12px', borderRadius: '6px',
        fontSize: '0.72rem', fontWeight: 500, cursor: 'pointer',
    },
    btnDel: {
        background: 'rgba(248,113,113,0.08)', color: '#f87171',
        border: '1px solid rgba(248,113,113,0.15)',
        padding: '5px 10px', borderRadius: '6px',
        fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
    },
    emptyState: {
        padding: '80px', textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
    },
    emptyIcon: { fontSize: '2rem', color: 'rgba(201,168,76,0.2)' },
    emptyText: { color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 },
    paginationBar: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        marginTop: '16px',
    },
    pageBtn: {
        background: 'rgba(201,168,76,0.08)',
        color: '#c9a84c',
        border: '1px solid rgba(201,168,76,0.2)',
        borderRadius: '8px',
        padding: '8px 14px',
        fontSize: '0.78rem',
        fontWeight: 600,
        cursor: 'pointer',
    },
    pageBtnDisabled: {
        opacity: 0.45,
        cursor: 'not-allowed',
    },
    pageInfo: {
        color: 'var(--text-secondary)',
        fontSize: '0.8rem',
        minWidth: '112px',
        textAlign: 'center',
    },
};
