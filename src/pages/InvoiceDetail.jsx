import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fetchInvoice, deleteInvoice } from '../api/invoiceApi';

export default function InvoiceDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [inv, setInv] = useState(null);
    const [loading, setLoading] = useState(true);
    const autoPrinted = useRef(false);

    useEffect(() => {
        fetchInvoice(id)
            .then(res => setInv(res.data.data))
            .catch(() => toast.error('Failed to load'))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        const shouldPrint = new URLSearchParams(location.search).get('print') === '1';
        if (!inv || !shouldPrint || autoPrinted.current) return;
        autoPrinted.current = true;
        const timer = setTimeout(() => window.print(), 250);
        return () => clearTimeout(timer);
    }, [inv, location.search]);

    const handleDelete = async () => {
        if (!window.confirm('Delete this invoice?')) return;
        await deleteInvoice(id);
        toast.success('Invoice deleted');
        navigate('/');
    };

    if (loading) return <div style={S.center}>Loading…</div>;
    if (!inv) return <div style={{ ...S.center, color: '#f87171' }}>Invoice not found</div>;

    const inferredAdminId = !inv.Adminid && /^AD-\d{8}-\d{3}$/i.test(String(inv.employeeId || ''))
        ? inv.employeeId : '';
    const displayedAdminId = inv.Adminid || inferredAdminId;

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
    const cgstTotal = (inv.taxSummary || []).reduce((s, r) => s + Number(r.cgstValue || 0), 0);
    const sgstTotal = (inv.taxSummary || []).reduce((s, r) => s + Number(r.sgstValue || 0), 0);
    const totalDue = Number(inv.totalAmount || 0);
    const billedItems = (inv.items || []).length;
    const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

    return (
        <div className="page-shell" style={{ maxWidth: '1040px' }}>
            {/* Actions Bar */}
            <div className="no-print detail-actions" style={S.actionsBar}>
                <button onClick={() => navigate('/')} style={S.btnBack}>← Back</button>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => window.print()} style={S.btnPrint}>Print</button>
                    <Link to={`/edit/${inv._id}`} style={S.btnEdit}>Edit</Link>
                    <button onClick={handleDelete} style={S.btnDel}>Delete</button>
                </div>
            </div>

            <div id="print-area" style={S.paper}>
                <div className="p-topbar" style={S.topBar} />

                <div style={S.paperInner}>
                    <div style={S.headerGrid}>
                        <div style={S.invoiceIntro}>
                            <div style={S.brandEyebrow}>BillFlow Premium</div>
                            <div className="p-title" style={S.invoiceTitle}>Tax Invoice</div>
                            <div style={S.invoiceNoLine}>Invoice No. {inv.invoiceNo}</div>
                            <div style={S.invoiceSub}>Official billing statement generated for customer delivery and print.</div>
                        </div>

                        <div style={S.amountPanel}>
                            <div style={S.statusPill}>Original</div>
                            <div style={S.amountLabel}>Amount Due</div>
                            <div style={S.amountValue}>{money(totalDue)}</div>
                            <div style={S.amountMetaRow}>
                                <span style={S.amountMetaKey}>Invoice Date</span>
                                <span style={S.amountMetaVal}>{fmtDate(inv.invoiceDate)}</span>
                            </div>
                            <div style={S.amountMetaRow}>
                                <span style={S.amountMetaKey}>Entry Date</span>
                                <span style={S.amountMetaVal}>{fmtDate(inv.entryDate || inv.invoiceDate)}</span>
                            </div>
                            <div style={S.amountMetaRow}>
                                <span style={S.amountMetaKey}>Items</span>
                                <span style={S.amountMetaVal}>{billedItems}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-mini-grid" style={S.miniGrid}>
                        {displayedAdminId && (
                            <div style={S.miniCard}>
                                <span style={S.miniLabel}>Admin ID</span>
                                <span style={S.miniValue}>{displayedAdminId}</span>
                            </div>
                        )}
                        {inv.employeeId && inv.employeeId !== displayedAdminId && (
                            <div style={S.miniCard}>
                                <span style={S.miniLabel}>Employee ID</span>
                                <span style={S.miniValue}>{inv.employeeId}</span>
                            </div>
                        )}
                        {inv.seller?.fssaiNo && (
                            <div style={S.miniCard}>
                                <span style={S.miniLabel}>FSSAI</span>
                                <span style={S.miniValue}>{inv.seller.fssaiNo}</span>
                            </div>
                        )}
                        {inv.seller?.pan && (
                            <div style={S.miniCard}>
                                <span style={S.miniLabel}>PAN</span>
                                <span style={S.miniValue}>{inv.seller.pan}</span>
                            </div>
                        )}
                        {inv.expiryDate && (
                            <div style={S.miniCard}>
                                <span style={S.miniLabel}>Expiry</span>
                                <span style={S.miniValue}>{fmtDate(inv.expiryDate)}</span>
                            </div>
                        )}
                    </div>

                    <div style={S.partyRow}>
                        <div className="p-party-card" style={S.partyCard}>
                            <div style={S.partyLabel}>From</div>
                            <div style={S.partyName}>{inv.seller?.name || 'Business Name'}</div>
                            {inv.seller?.address && <div style={S.partyLine}>{inv.seller.address}</div>}
                            {!!(inv.seller?.city || inv.seller?.state || inv.seller?.pincode) && (
                                <div style={S.partyLine}>{[inv.seller?.city, inv.seller?.state, inv.seller?.pincode].filter(Boolean).join(', ')}</div>
                            )}
                            {inv.seller?.phone && <div style={S.partyLine}>Phone: {inv.seller.phone}</div>}
                        </div>

                        <div className="p-party-card" style={S.partyCard}>
                            <div style={S.partyLabel}>Bill To</div>
                            <div style={S.partyName}>{inv.buyer?.name || 'Buyer name'}</div>
                            {inv.buyer?.address && <div style={S.partyLine}>{inv.buyer.address}</div>}
                            {inv.buyer?.route && <div style={S.partyLine}>Route: {inv.buyer.route}</div>}
                            {inv.buyer?.phone && <div style={S.partyLine}>Phone: {inv.buyer.phone}</div>}
                        </div>
                    </div>

                    <div className="p-table-wrap table-scroll" style={S.tableWrap}>
                        <table style={S.table}>
                            <thead>
                                <tr>
                                    {['#', 'Particulars', 'Qty', 'Rate', 'Gross', 'CGST', 'SGST', 'Amount'].map(h => (
                                        <th key={h} className="p-th" style={S.th}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(inv.items || []).map((item, idx) => (
                                    <tr key={idx} style={idx % 2 === 0 ? S.trEven : S.trOdd}>
                                        <td style={S.td}>{idx + 1}</td>
                                        <td style={{ ...S.td, ...S.tdName }}>{item.particulars}</td>
                                        <td style={S.td}>{item.qty}</td>
                                        <td style={S.td}>{money(item.rate)}</td>
                                        <td style={S.td}>{money(item.grossAmt)}</td>
                                        <td style={S.td}>{item.cgstPct}% ({money(item.cgstAmt)})</td>
                                        <td style={S.td}>{item.sgstPct}% ({money(item.sgstAmt)})</td>
                                        <td style={{ ...S.td, ...S.tdAmt }}>{money(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-bottom-block" style={S.bottomRow}>
                        <div style={S.taxBox}>
                            <div style={S.sectionLabel}>Tax Breakdown</div>
                            <div style={S.taxGrid}>
                                <div style={S.taxCell}>
                                    <span style={S.taxCellLabel}>CGST</span>
                                    <span style={S.taxCellValue}>{money(cgstTotal)}</span>
                                </div>
                                <div style={S.taxCell}>
                                    <span style={S.taxCellLabel}>SGST</span>
                                    <span style={S.taxCellValue}>{money(sgstTotal)}</span>
                                </div>
                                <div style={S.taxCell}>
                                    <span style={S.taxCellLabel}>Total Tax</span>
                                    <span style={S.taxCellValue}>{money(inv.totalTax)}</span>
                                </div>
                                <div style={S.taxCell}>
                                    <span style={S.taxCellLabel}>Rounded</span>
                                    <span style={S.taxCellValue}>{money(inv.roundedOff)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-totals" style={S.totalsBox}>
                            {[
                                ['Sub Total', money(inv.totalUnits)],
                                ['CGST Total', money(cgstTotal)],
                                ['SGST Total', money(sgstTotal)],
                                ['Total Tax', money(inv.totalTax)],
                                ['Rounded Off', money(inv.roundedOff)],
                            ].map(([l, v]) => (
                                <div key={l} className="p-total-row" style={S.totalRow}>
                                    <span style={S.totalLabel}>{l}</span>
                                    <span style={S.totalVal}>{v}</span>
                                </div>
                            ))}

                            <div className="p-grand" style={S.grandTotalRow}>
                                <span className="p-grand-label" style={S.grandTotalLabel}>Grand Total</span>
                                <span className="p-grand-val" style={S.grandTotalVal}>{money(totalDue)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-bottombar" style={S.bottomBar} />
            </div>

            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 8mm 10mm; }
                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    body * { visibility: hidden; }
                    #print-area, #print-area * { visibility: visible; }
                    .no-print { display: none !important; }

                    #print-area {
                        position: static !important;
                        left: auto !important;
                        top: auto !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        background: #fff !important; border: none !important;
                        border-radius: 0 !important; box-shadow: none !important;
                        overflow: visible !important;
                        page-break-after: avoid !important;
                        break-after: avoid-page !important;
                    }

                    #print-area * {
                        background: transparent !important;
                        box-shadow: none !important;
                        color: #1a1a1a !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        border-color: #ddd !important;
                    }

                    #print-area .p-topbar,
                    #print-area .p-bottombar {
                        background: #1a3a6b !important;
                    }

                    #print-area .p-bottombar {
                        display: none !important;
                    }

                    #print-area .p-title {
                        color: #1a1a2e !important;
                        font-size: 2rem !important;
                        -webkit-text-stroke: 0 !important;
                    }

                    #print-area .p-party-card,
                    #print-area .p-totals,
                    #print-area .p-tax-box,
                    #print-area .p-mini-grid > div {
                        border: 1px solid #d8e2f7 !important;
                        background: #f9fbff !important;
                    }

                    #print-area .p-mini-grid {
                        grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
                    }

                    #print-area .p-th {
                        background: #1a3a6b !important;
                        color: #ffffff !important;
                        border-color: #1a3a6b !important;
                        padding: 5px 6px !important;
                        font-size: 0.52rem !important;
                        letter-spacing: 0.6px !important;
                        white-space: nowrap !important;
                    }

                    #print-area table tbody tr:nth-child(even) td {
                        background: #f2f6ff !important;
                    }

                    #print-area .p-table-wrap {
                        overflow: visible !important;
                    }

                    #print-area .p-table-wrap table {
                        min-width: 0 !important;
                        width: 100% !important;
                        table-layout: fixed !important;
                    }

                    #print-area table tbody td {
                        padding: 4px 6px !important;
                        font-size: 0.62rem !important;
                        border-bottom: 1px solid #e0e0e0 !important;
                        border-color: #e0e0e0 !important;
                        white-space: normal !important;
                        word-break: break-word !important;
                    }

                    #print-area .p-total-row {
                        border-bottom: 1px solid #e0e0e0 !important;
                        border-color: #e0e0e0 !important;
                    }

                    #print-area .p-grand {
                        background: #1a3a6b !important;
                        border-color: #1a3a6b !important;
                        border-radius: 5px !important;
                    }
                    #print-area .p-grand-label,
                    #print-area .p-grand-val { color: #ffffff !important; }

                    #print-area .p-bottom-block {
                        display: grid !important;
                        grid-template-columns: 1.2fr 0.9fr !important;
                        gap: 16px !important;
                        align-items: start !important;
                        break-inside: avoid-page !important;
                        page-break-inside: avoid !important;
                    }

                    #print-area table,
                    #print-area tr,
                    #print-area td,
                    #print-area th {
                        page-break-inside: avoid !important;
                        break-inside: avoid-page !important;
                    }
                }

                @media (max-width: 760px) {
                    .p-mini-grid {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                    .p-bottom-block {
                        flex-direction: column !important;
                    }
                    .p-party-card,
                    .p-tax-box,
                    .p-totals {
                        width: 100% !important;
                    }
                }
            `}</style>
        </div>
    );
}

const BLUE = '#1a3a6b';
const BLUE_LIGHT = 'rgba(26,58,107,0.08)';

const S = {
    center: { textAlign: 'center', padding: '80px', color: 'var(--text-muted)' },
    actionsBar: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '24px',
    },
    btnBack: {
        background: 'transparent', border: '1px solid var(--muted-border)',
        color: 'var(--text-muted)', padding: '8px 18px', borderRadius: '8px',
        fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
    },
    btnPrint: {
        background: BLUE_LIGHT, border: `1px solid ${BLUE}33`,
        color: BLUE, padding: '8px 18px', borderRadius: '8px',
        fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
    },
    btnEdit: {
        background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.25)',
        color: '#3b82f6', padding: '8px 18px', borderRadius: '8px',
        fontSize: '0.78rem', fontWeight: 500, display: 'inline-flex', alignItems: 'center',
    },
    btnDel: {
        background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
        color: '#f87171', padding: '8px 18px', borderRadius: '8px',
        fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
    },

    /* Paper */
    paper: {
        background: 'var(--surface-gradient)',
        borderRadius: '16px', border: '1px solid var(--line-medium)',
        overflow: 'hidden', boxShadow: 'var(--shadow-raised)',
    },
    topBar: { height: '10px', background: `linear-gradient(90deg, ${BLUE}, #2e5db3)` },
    bottomBar: { height: '10px', background: `linear-gradient(90deg, ${BLUE}, #2e5db3)` },
    paperInner: { padding: '28px 30px 24px' },

    headerGrid: {
        display: 'grid',
        gridTemplateColumns: '1.2fr 0.8fr',
        gap: '20px',
        alignItems: 'start',
        marginBottom: '12px',
    },
    invoiceIntro: {
        borderBottom: '1px solid var(--line-soft)',
        paddingBottom: '14px',
        minHeight: '170px',
    },
    brandEyebrow: {
        fontSize: '0.64rem',
        textTransform: 'uppercase',
        letterSpacing: '2px',
        color: 'color-mix(in srgb, var(--gold) 72%, transparent)',
        marginBottom: '8px',
    },
    amountPanel: {
        borderRadius: '16px',
        border: '1px solid rgba(59,130,246,0.18)',
        background: 'linear-gradient(180deg, rgba(59,130,246,0.14), rgba(59,130,246,0.04))',
        padding: '16px 16px 14px',
    },
    invoiceTitle: {
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '2.75rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        letterSpacing: '1.2px',
        lineHeight: 1,
        marginBottom: '6px',
    },
    invoiceNoLine: {
        fontSize: '0.84rem',
        color: 'var(--text-secondary)',
        fontWeight: 600,
    },
    invoiceSub: {
        fontSize: '0.72rem',
        color: 'var(--text-muted)',
        letterSpacing: '0.4px',
        marginTop: '8px',
    },
    statusPill: {
        display: 'inline-flex',
        alignSelf: 'flex-start',
        padding: '4px 12px',
        borderRadius: '999px',
        border: `1px solid ${BLUE}55`,
        background: BLUE_LIGHT,
        color: BLUE,
        fontSize: '0.62rem',
        fontWeight: 700,
        letterSpacing: '1.2px',
        textTransform: 'uppercase',
    },
    amountLabel: {
        fontSize: '0.64rem',
        marginTop: '14px',
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        color: 'color-mix(in srgb, var(--gold) 72%, transparent)',
        fontWeight: 700,
    },
    amountValue: {
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '2rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginTop: '2px',
        marginBottom: '10px',
    },
    amountMetaRow: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '5px 0',
        borderTop: '1px solid rgba(59,130,246,0.12)',
    },
    amountMetaKey: {
        fontSize: '0.68rem',
        color: 'var(--text-muted)',
        fontWeight: 700,
        letterSpacing: '0.3px',
    },
    amountMetaVal: {
        fontSize: '0.7rem',
        color: 'var(--text-primary)',
        fontWeight: 600,
    },
    metaGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '10px',
    },
    metaCard: {
        border: '1px solid var(--line-soft)',
        background: 'color-mix(in srgb, var(--surface) 95%, transparent)',
        borderRadius: '10px',
        padding: '9px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    metaCardLabel: {
        fontSize: '0.58rem',
        color: 'color-mix(in srgb, var(--gold) 68%, transparent)',
        letterSpacing: '1.2px',
        fontWeight: 700,
        textTransform: 'uppercase',
    },
    metaCardValue: {
        fontSize: '0.78rem',
        color: 'var(--text-primary)',
        fontWeight: 600,
    },
    miniGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
        gap: '10px',
        marginBottom: '12px',
    },
    miniCard: {
        border: '1px solid var(--line-soft)',
        background: 'color-mix(in srgb, var(--surface) 95%, transparent)',
        borderRadius: '10px',
        padding: '8px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
        minWidth: 0,
    },
    miniLabel: {
        fontSize: '0.55rem',
        color: 'color-mix(in srgb, var(--gold) 68%, transparent)',
        letterSpacing: '1.1px',
        textTransform: 'uppercase',
        fontWeight: 700,
    },
    miniValue: {
        fontSize: '0.7rem',
        color: 'var(--text-primary)',
        fontWeight: 600,
        wordBreak: 'break-word',
    },

    metaLine: {
        display: 'grid',
        gridTemplateColumns: '98px 12px 1fr',
        marginBottom: '3px',
        alignItems: 'baseline',
    },
    metaKey: { fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.4px' },
    metaColon: { fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center' },
    metaVal: { fontSize: '0.72rem', color: 'var(--text-primary)', fontWeight: 500 },

    partyRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '12px',
    },
    partyCard: {
        border: '1px solid var(--line-soft)',
        background: 'color-mix(in srgb, var(--surface) 95%, transparent)',
        borderRadius: '12px',
        padding: '12px 14px',
    },
    partyLabel: {
        fontSize: '0.6rem',
        fontWeight: 700,
        color: 'color-mix(in srgb, var(--gold) 68%, transparent)',
        letterSpacing: '1.2px',
        marginBottom: '6px',
        textTransform: 'uppercase',
    },
    partyName: { fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' },
    partyLine: { fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '2px', lineHeight: 1.4 },

    tableWrap: {
        border: '1px solid var(--line-soft)',
        borderRadius: '12px',
        overflowX: 'auto',
        overflowY: 'hidden',
        marginBottom: '12px',
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: {
        background: `linear-gradient(90deg, ${BLUE}, #2e5db3)`,
        color: '#fff',
        padding: '8px 10px',
        fontSize: '0.58rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '1px',
        textAlign: 'left',
        whiteSpace: 'nowrap',
    },
    trEven: { background: 'transparent', borderBottom: '1px solid var(--table-row-border)' },
    trOdd: { background: BLUE_LIGHT, borderBottom: '1px solid var(--table-row-border)' },
    td: { padding: '8px 10px', fontSize: '0.73rem', color: 'var(--text-secondary)', verticalAlign: 'middle' },
    tdName: { fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-word' },
    tdAmt: { fontWeight: 700, color: 'var(--text-primary)' },

    bottomRow: {
        display: 'flex', gap: '14px', justifyContent: 'space-between',
        alignItems: 'stretch',
        flexWrap: 'wrap',
    },
    sectionLabel: {
        fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)',
        letterSpacing: '1.3px', textTransform: 'uppercase',
        marginBottom: '5px', borderBottom: '1px solid var(--line-soft)', paddingBottom: '3px',
    },

    taxBox: {
        minWidth: '220px',
        flex: '0 0 250px',
        border: '1px solid var(--line-soft)',
        borderRadius: '10px',
        padding: '10px 12px',
        background: 'color-mix(in srgb, var(--surface) 95%, transparent)',
    },
    taxGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
    },
    taxCell: {
        border: '1px solid var(--line-soft)',
        borderRadius: '8px',
        padding: '8px 9px',
        background: 'color-mix(in srgb, var(--surface) 98%, transparent)',
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
    },
    taxCellLabel: {
        fontSize: '0.55rem',
        color: 'color-mix(in srgb, var(--gold) 68%, transparent)',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '1.1px',
    },
    taxCellValue: {
        fontSize: '0.72rem',
        color: 'var(--text-primary)',
        fontWeight: 600,
    },

    totalsBox: {
        minWidth: '250px',
        maxWidth: '290px',
        border: '1px solid var(--line-soft)',
        borderRadius: '10px',
        padding: '10px',
        background: 'color-mix(in srgb, var(--surface) 95%, transparent)',
    },
    totalRow: {
        display: 'flex', justifyContent: 'space-between',
        padding: '6px 2px', borderBottom: '1px solid var(--line-soft)',
    },
    totalLabel: { fontSize: '0.64rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px' },
    totalVal: { fontSize: '0.76rem', color: 'var(--text-primary)', fontWeight: 600 },
    grandTotalRow: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 12px', marginTop: '8px',
        background: `linear-gradient(90deg, ${BLUE}, #2e5db3)`,
        borderRadius: '8px',
    },
    grandTotalLabel: { fontSize: '0.64rem', fontWeight: 800, color: '#fff', letterSpacing: '1.2px', textTransform: 'uppercase' },
    grandTotalVal: { fontSize: '1.02rem', fontWeight: 700, color: '#fff' },
};
