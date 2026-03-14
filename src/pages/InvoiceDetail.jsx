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
        ? inv.employeeId
        : '';
    const displayedAdminId = inv.Adminid || inferredAdminId;

    return (
        <div className="page-shell" style={{ maxWidth: '960px' }}>
            {/* Actions Bar */}
            <div className="no-print detail-actions" style={S.actionsBar}>
                <button onClick={() => navigate('/')} style={S.btnBack}>← Back</button>
                <div className="page-header-actions" style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => window.print()} style={S.btnPrint}>Print</button>
                    <Link to={`/edit/${inv._id}`} style={S.btnEdit}>Edit</Link>
                    <button onClick={handleDelete} style={S.btnDel}>Delete</button>
                </div>
            </div>

            {/* Invoice Paper */}
            <div id="print-area" style={S.paper}>
                {/* Paper top accent */}
                <div className="p-accent" style={S.paperAccent} />

                <div style={S.paperInner}>
                    {/* Invoice Header */}
                    <div style={S.invoiceHeader}>
                        <div>
                            <div className="p-title" style={S.invoiceType}>TAX INVOICE</div>
                            <div style={S.invoiceMeta}>
                                <span style={S.metaLabel}>Invoice No</span>
                                <span style={S.metaValue}>{inv.invoiceNo}</span>
                            </div>
                            <div style={S.invoiceMeta}>
                                <span style={S.metaLabel}>Date</span>
                                <span style={S.metaValue}>
                                    {new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                            {inv.entryDate && (
                                <div style={S.invoiceMeta}>
                                    <span style={S.metaLabel}>Entry Date</span>
                                    <span style={S.metaValue}>
                                        {new Date(inv.entryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                            )}
                            {inv.expiryDate && (
                                <div style={S.invoiceMeta}>
                                    <span style={S.metaLabel}>Expiry Date</span>
                                    <span style={S.metaValue}>
                                        {new Date(inv.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                            )}
                            {displayedAdminId && (
                                <div style={S.invoiceMeta}>
                                    <span style={S.metaLabel}>Admin ID</span>
                                    <span style={S.metaValue}>{displayedAdminId}</span>
                                </div>
                            )}
                            {inv.employeeId && inv.employeeId !== displayedAdminId && (
                                <div style={S.invoiceMeta}>
                                    <span style={S.metaLabel}>Employee ID</span>
                                    <span style={S.metaValue}>{inv.employeeId}</span>
                                </div>
                            )}
                        </div>
                        <div>
                            <span className="p-badge" style={S.badge}>ORIGINAL</span>
                        </div>
                    </div>

                    <div className="p-divider" style={S.divider} />

                    {/* Parties */}
                    <div className="responsive-party-row" style={S.partyRow}>
                        <div style={S.partyBox}>
                            <div style={S.partyLabel}>SELLER</div>
                            <div style={S.partyName}>{inv.seller?.name}</div>
                            {inv.seller?.address && <div style={S.partyLine}>{inv.seller.address}</div>}
                            {inv.seller?.city && <div style={S.partyLine}>{inv.seller.city}, {inv.seller.state} — {inv.seller.pincode}</div>}
                            {inv.seller?.phone && <div style={S.partyLine}>{inv.seller.phone}</div>}
                            {inv.seller?.gstin && <div style={S.partyLine}>GSTIN: {inv.seller.gstin}</div>}
                            {inv.seller?.fssaiNo && <div style={S.partyLine}>FSSAI: {inv.seller.fssaiNo}</div>}
                            {inv.seller?.pan && <div style={S.partyLine}>PAN: {inv.seller.pan}</div>}
                        </div>
                        <div className="p-party-div responsive-party-divider" style={S.partyDivider} />
                        <div style={S.partyBox}>
                            <div style={S.partyLabel}>BUYER</div>
                            <div style={S.partyName}>{inv.buyer?.name}</div>
                            {inv.buyer?.address && <div style={S.partyLine}>{inv.buyer.address}</div>}
                            {inv.buyer?.route && <div style={S.partyLine}>Route: {inv.buyer.route}</div>}
                            {inv.buyer?.phone && <div style={S.partyLine}>{inv.buyer.phone}</div>}
                        </div>
                    </div>

                    <div className="p-divider" style={S.divider} />

                    {/* Items Table */}
                    <div className="table-scroll table-scroll-wide">
                        <table style={S.table}>
                            <thead>
                                <tr style={S.theadRow}>
                                    {['#', 'Particulars', 'Qty', 'Rate', 'Gross', 'CGST%', 'CGST ₹', 'SGST%', 'SGST ₹', 'Total'].map(h => (
                                        <th key={h} style={S.th}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(inv.items || []).map((item, idx) => (
                                    <tr key={idx} style={{ ...S.tr, background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                                        <td style={S.td}><span style={S.rowNum}>{idx + 1}</span></td>
                                        <td style={{ ...S.td, fontWeight: 500, color: '#ede8db' }}>{item.particulars}</td>
                                        <td style={S.td}>{item.qty}</td>
                                        <td style={S.td}>₹{item.rate}</td>
                                        <td style={S.td}>₹{item.grossAmt}</td>
                                        <td style={S.td}>{item.cgstPct}%</td>
                                        <td style={S.td}>₹{item.cgstAmt}</td>
                                        <td style={S.td}>{item.sgstPct}%</td>
                                        <td style={S.td}>₹{item.sgstAmt}</td>
                                        <td style={{ ...S.td, color: '#34d399', fontWeight: 600 }}>₹{item.total}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-divider" style={S.divider} />

                    {/* Bottom: Tax Summary + Totals */}
                    <div className="responsive-row" style={S.bottomRow}>
                        {/* Tax Summary */}
                        <div style={{ flex: 1 }}>
                            <div style={S.sectionTitle}>Tax Summary</div>
                            <table style={{ ...S.table, fontSize: '0.75rem' }}>
                                <thead>
                                    <tr style={S.theadRow}>
                                        <th style={S.th}>CGST%</th><th style={S.th}>CGST ₹</th>
                                        <th style={S.th}>SGST%</th><th style={S.th}>SGST ₹</th>
                                        <th style={S.th}>Taxable</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(inv.taxSummary || []).map((row, i) => (
                                        <tr key={i} style={S.tr}>
                                            <td style={S.td}>{row.cgstPct}%</td>
                                            <td style={S.td}>₹{row.cgstValue}</td>
                                            <td style={S.td}>{row.sgstPct}%</td>
                                            <td style={S.td}>₹{row.sgstValue}</td>
                                            <td style={S.td}>₹{row.taxable}</td>
                                        </tr>
                                    ))}
                                    <tr style={{ ...S.tr, background: 'rgba(201,168,76,0.04)' }}>
                                        <td style={{ ...S.td, color: 'rgba(201,168,76,0.6)', fontWeight: 600 }}>Total</td>
                                        <td style={{ ...S.td, fontWeight: 600 }}>₹{inv.cgstTotal}</td>
                                        <td style={S.td}></td>
                                        <td style={{ ...S.td, fontWeight: 600 }}>₹{inv.sgstTotal}</td>
                                        <td style={S.td}></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="responsive-summary-panel" style={S.totalsBox}>
                            <div style={S.sectionTitle}>Totals</div>
                            {[
                                ['Total (units)', `₹${inv.totalUnits}`],
                                ['Total Discount', '₹0.00'],
                                ['Total Tax', `₹${inv.totalTax}`],
                            ].map(([l, v]) => (
                                <div key={l} style={S.totalRow}>
                                    <span style={S.totalLabel}>{l}</span>
                                    <span style={S.totalVal}>{v}</span>
                                </div>
                            ))}
                            <div style={S.totalDivider} />
                            <div style={S.totalRow}>
                                <span style={S.totalLabel}>Net Amount</span>
                                <span style={S.totalVal}>₹{inv.netAmount}</span>
                            </div>
                            <div style={S.totalRow}>
                                <span style={S.totalLabel}>Rounded Off</span>
                                <span style={S.totalVal}>₹{inv.roundedOff}</span>
                            </div>
                            <div className="p-grand" style={S.grandTotalRow}>
                                <span className="p-grand-label" style={S.grandTotalLabel}>GRAND TOTAL</span>
                                <span className="p-grand-val" style={S.grandTotalVal}>₹{inv.totalAmount?.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Signature */}
                    <div style={S.signatureRow}>
                        <div style={S.signatureBox}>
                            <div style={S.signatureLine} />
                            <div style={S.signatureFor}>For {inv.seller?.name}</div>
                            <div style={S.signatureTitle}>Authorised Signatory</div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 10mm 12mm; }
                    body * { visibility: hidden; }
                    #print-area, #print-area * { visibility: visible; }
                    .no-print { display: none !important; }

                    #print-area {
                        position: absolute !important; left: 0 !important; top: 0 !important;
                        width: 100% !important; padding: 0 !important;
                        background: #fff !important; border: none !important;
                        border-radius: 0 !important; box-shadow: none !important;
                        overflow: visible !important;
                    }

                    /* Reset all child elements to clean white/black */
                    #print-area * {
                        background: transparent !important;
                        box-shadow: none !important;
                        color: #1a1a1a !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        border-color: #ddd !important;
                    }

                    /* Hide the decorative top accent bar */
                    #print-area .p-accent { display: none !important; }

                    /* Gold horizontal dividers */
                    #print-area .p-divider { background: #b8a060 !important; }

                    /* Vertical party divider */
                    #print-area .p-party-div { background: #ccc !important; }

                    /* Invoice title — navy */
                    #print-area .p-title { color: #1a2744 !important; }

                    /* ORIGINAL badge */
                    #print-area .p-badge {
                        border: 1px solid #1a2744 !important;
                        color: #1a2744 !important;
                        border-radius: 3px !important;
                        background: transparent !important;
                    }

                    /* Table headers — navy background, white text */
                    #print-area table thead th {
                        background: #1a2744 !important;
                        color: #ffffff !important;
                        border-bottom: 2px solid #b8a060 !important;
                        border-color: #b8a060 !important;
                        padding: 7px 8px !important;
                        font-size: 0.62rem !important;
                        letter-spacing: 1px !important;
                    }

                    /* Alternating table rows */
                    #print-area table tbody tr:nth-child(even) td {
                        background: #f7f4ed !important;
                    }

                    /* Table cell borders */
                    #print-area table tbody td {
                        border-bottom: 1px solid #ede8d8 !important;
                        border-color: #ede8d8 !important;
                        padding: 5px 8px !important;
                        font-size: 0.72rem !important;
                    }

                    /* Grand total box — navy bg */
                    #print-area .p-grand {
                        background: #1a2744 !important;
                        border-radius: 4px !important;
                        border-color: #1a2744 !important;
                    }
                    #print-area .p-grand-label { color: #b8a060 !important; }
                    #print-area .p-grand-val  { color: #ffffff !important; }
                }
            `}</style>
        </div>
    );
}

const S = {
    center: { textAlign: 'center', padding: '80px', color: 'var(--text-muted)' },
    actionsBar: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '24px',
    },
    btnBack: {
        background: 'transparent', border: '1px solid var(--muted-border)',
        color: 'var(--text-muted)', padding: '8px 18px', borderRadius: '8px',
        fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', letterSpacing: '0.3px',
    },
    btnPrint: {
        background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.18)',
        color: '#c9a84c', padding: '8px 18px', borderRadius: '8px',
        fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
    },
    btnEdit: {
        background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.18)',
        color: '#fbbf24', padding: '8px 18px', borderRadius: '8px',
        fontSize: '0.78rem', fontWeight: 500, display: 'inline-flex', alignItems: 'center',
    },
    btnDel: {
        background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)',
        color: '#f87171', padding: '8px 18px', borderRadius: '8px',
        fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
    },
    paper: {
        background: 'var(--surface-gradient)',
        borderRadius: '18px', border: '1px solid var(--line-medium)',
        overflow: 'hidden', boxShadow: 'var(--shadow-raised)',
    },
    paperAccent: { height: '2px', background: 'var(--top-line-gradient)' },
    paperInner: { padding: '32px' },
    invoiceHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
    invoiceType: {
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '1.6rem', fontWeight: 600, color: '#c9a84c',
        letterSpacing: '2px', marginBottom: '12px',
    },
    invoiceMeta: { display: 'flex', gap: '12px', marginBottom: '4px', alignItems: 'center' },
    metaLabel: { fontSize: '0.65rem', color: 'color-mix(in srgb, var(--gold) 55%, transparent)', fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', width: '80px' },
    metaValue: { fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500 },
    badge: {
        background: 'rgba(52,211,153,0.08)', color: '#34d399',
        border: '1px solid rgba(52,211,153,0.2)',
        borderRadius: '20px', padding: '6px 18px',
        fontSize: '0.65rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase',
    },
    divider: { height: '1px', background: 'var(--line-medium)', margin: '20px 0' },
    partyRow: { display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0', marginBottom: '4px' },
    partyBox: { padding: '4px 8px' },
    partyDivider: { width: '1px', background: 'var(--line-medium)', margin: '0 16px' },
    partyLabel: { fontSize: '0.58rem', fontWeight: 700, color: 'color-mix(in srgb, var(--gold) 55%, transparent)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' },
    partyName: { fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' },
    partyLine: { fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    theadRow: { borderBottom: '1px solid var(--line-medium)' },
    th: { padding: '10px 10px', textAlign: 'left', fontSize: '0.6rem', fontWeight: 600, color: 'color-mix(in srgb, var(--gold) 50%, transparent)', letterSpacing: '1.5px', textTransform: 'uppercase', whiteSpace: 'nowrap', background: 'color-mix(in srgb, var(--gold) 5%, transparent)' },
    tr: { borderBottom: '1px solid var(--table-row-border)' },
    td: { padding: '9px 10px', fontSize: '0.78rem', color: 'var(--text-secondary)', verticalAlign: 'middle' },
    rowNum: {
        width: '22px', height: '22px', borderRadius: '50%',
        background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.62rem', fontWeight: 700, color: 'rgba(201,168,76,0.5)',
    },
    bottomRow: { display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between' },
    sectionTitle: { fontSize: '0.6rem', fontWeight: 700, color: 'color-mix(in srgb, var(--gold) 50%, transparent)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' },
    totalsBox: { minWidth: '170px', maxWidth: '185px' },
    totalRow: { display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' },
    totalLabel: { fontSize: '0.64rem', color: 'var(--text-muted)' },
    totalVal: { fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 500 },
    totalDivider: { height: '1px', background: 'var(--line-medium)', margin: '5px 0' },
    grandTotalRow: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '7px 10px', marginTop: '4px',
        background: 'var(--gold-dim)',
        border: '1px solid var(--line-strong)',
        borderRadius: '6px',
    },
    grandTotalLabel: { fontSize: '0.55rem', fontWeight: 700, color: 'color-mix(in srgb, var(--gold) 70%, transparent)', letterSpacing: '1.2px', textTransform: 'uppercase' },
    grandTotalVal: {
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '0.95rem', fontWeight: 600, color: 'var(--gold)',
    },
    signatureRow: { display: 'flex', justifyContent: 'flex-end', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--line-soft)' },
    signatureBox: { textAlign: 'center', minWidth: '180px' },
    signatureLine: { height: '1px', background: 'var(--gold-border)', marginBottom: '10px' },
    signatureFor: { fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '3px' },
    signatureTitle: { fontSize: '0.62rem', color: 'color-mix(in srgb, var(--gold) 50%, transparent)', letterSpacing: '1.5px', textTransform: 'uppercase' },
};
