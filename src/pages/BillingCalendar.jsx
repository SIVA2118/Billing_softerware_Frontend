import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fetchInvoicesByDate } from '../api/invoiceApi';

// PDF generator (self‑contained)
import { jsPDF } from 'jspdf';

const generateBillingPdf = async (isoDate, invoices) => {
  if (!Array.isArray(invoices) || invoices.length === 0) return;

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const lineHeight = 18;
  const contentWidth = pageWidth - margin * 2;
  const tableX = margin + 10;
  const tableWidths = { product: 180, qty: 50, free: 50, rate: 80, amount: 80 };
  const pageFooterHeight = 30;

  const drawHeader = (pageNumber, totalPages) => {
    doc.setFontSize(20);
    doc.setTextColor('#121212');
    doc.text('Billing Report', pageWidth / 2, margin, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor('#555555');
    doc.text(`Date: ${isoDate}`, margin, margin + 28);
    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, margin + 28, {
      align: 'right',
    });

    doc.setDrawColor('#cccccc');
    doc.setLineWidth(0.5);
    doc.line(margin, margin + 36, pageWidth - margin, margin + 36);
  };

  const totalPages = Math.max(1, Math.ceil(invoices.length / 3));
  let pageNumber = 1;
  let y = margin + 60;

  drawHeader(pageNumber, totalPages);

  invoices.forEach((inv, idx) => {
    const itemCount = Array.isArray(inv.items) ? inv.items.length : 0;
    const invoiceBlockHeight = 90 + itemCount * 18 + 30;

    if (y + invoiceBlockHeight > pageHeight - margin - pageFooterHeight) {
      doc.addPage();
      pageNumber += 1;
      y = margin + 60;
      drawHeader(pageNumber, totalPages);
    }

    doc.setFillColor('#f7f7f7');
    doc.roundedRect(margin, y - 12, contentWidth, invoiceBlockHeight - 12, 8, 8, 'F');

    doc.setFontSize(12);
    doc.setTextColor('#1d4ed8');
    doc.text(`${idx + 1}. ${inv.buyer?.name || 'Unnamed Buyer'}`, margin + 12, y);

    doc.setFontSize(10);
    doc.setTextColor('#333333');
    doc.text(`Invoice #: ${inv.invoiceNo}`, margin + 12, y + 18);
    doc.text(`Date: ${new Date(inv.invoiceDate).toLocaleDateString()}`, pageWidth - margin - 12, y + 18, {
      align: 'right',
    });

    y += 36;
    doc.setFillColor('#e5e7eb');
    doc.rect(tableX, y - 14, tableWidths.product + tableWidths.qty + tableWidths.free + tableWidths.rate + tableWidths.amount, lineHeight, 'F');

    doc.setFontSize(10);
    doc.setTextColor('#111827');
    doc.text('Product', tableX + 4, y);
    doc.text('Qty', tableX + tableWidths.product + 8, y);
    doc.text('Free', tableX + tableWidths.product + tableWidths.qty + 8, y);
    doc.text('Rate', tableX + tableWidths.product + tableWidths.qty + tableWidths.free + 8, y);
    doc.text('Amount', tableX + tableWidths.product + tableWidths.qty + tableWidths.free + tableWidths.rate + 8, y);

    y += lineHeight;

    const items = Array.isArray(inv.items) ? inv.items : [];
    items.forEach((item) => {
      const product = item.particulars || '—';
      const qty = String(item.qty2 ?? item.qty ?? '');
      const freeQty = String(item.freeQty ?? '0');
      const rate = String(item.rate || '');
      const amount = String(item.total || '');

      doc.setFontSize(10);
      doc.setTextColor('#1f2937');
      doc.text(product, tableX + 4, y);
      doc.text(qty, tableX + tableWidths.product + 8, y);
      doc.text(freeQty, tableX + tableWidths.product + tableWidths.qty + 8, y);
      doc.text(rate, tableX + tableWidths.product + tableWidths.qty + tableWidths.free + 8, y);
      doc.text(amount, tableX + tableWidths.product + tableWidths.qty + tableWidths.free + tableWidths.rate + 8, y);
      y += lineHeight;
    });

    const invoiceTotal = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
    y += 6;
    doc.setDrawColor('#d1d5db');
    doc.setLineWidth(0.5);
    doc.line(tableX, y, tableX + tableWidths.product + tableWidths.qty + tableWidths.free + tableWidths.rate + tableWidths.amount, y);
    y += 14;

    doc.setFontSize(11);
    doc.setTextColor('#0f172a');
    doc.text('Invoice Total', tableX + tableWidths.product + tableWidths.qty + 8, y);
    doc.text(`${invoiceTotal.toFixed(2)}`, tableX + tableWidths.product + tableWidths.qty + tableWidths.rate + 8, y);

    y += 30;

    if (idx < invoices.length - 1 && y + 80 > pageHeight - margin - pageFooterHeight) {
      doc.addPage();
      pageNumber += 1;
      y = margin + 60;
      drawHeader(pageNumber, totalPages);
    }
  });

  doc.save(`billing-${isoDate}.pdf`);
};

const BillingCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10; // 10 buyers per PDF page / UI page

  // Fetch invoices when date changes
  const formatLocalDate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (!selectedDate) return;
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const iso = formatLocalDate(selectedDate);
        const res = await fetchInvoicesByDate(iso);
        if (res?.data?.success) {
          setInvoices(res.data.data);
          setPage(1);
        } else {
          setInvoices([]);
        }
      } catch (e) {
        setError(e.response?.data?.message || e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDate]);

  const handleExport = async () => {
    if (!selectedDate) return;
    const iso = formatLocalDate(selectedDate);
    await generateBillingPdf(iso, invoices);
  };

  // Pagination for UI (10 buyers per page)
  const totalPages = Math.ceil(invoices.length / pageSize);
  const paginated = invoices.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="page-shell" style={S.container} id="billing-calendar-page">
      <div style={S.header}>
        <h1 className="page-title-display" style={S.title}>Billing Calendar</h1>
        <p style={S.subtitle}>Select a date to view and export the billing orders of that day.</p>
      </div>

      <div className="billing-calendar-layout">
        <div className="billing-calendar-pane">
          <div style={S.card}>
            <div style={S.cardTopLine} />
            <div style={S.cardInner}>
              <div style={S.field} id="calendar-input">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={S.label}>Select Date</label>
                  <label style={S.pickerWrapper} aria-label="Billing calendar">
                    <DatePicker
                      selected={selectedDate}
                      onChange={(date) => setSelectedDate(date)}
                      dateFormat="yyyy-MM-dd"
                      inline
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      calendarClassName="premium-datepicker-calendar"
                      dayClassName={(date) => selectedDate && date.toDateString() === selectedDate.toDateString() ? 'premium-datepicker-day-selected' : undefined}
                      shouldCloseOnSelect={false}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="billing-details-pane">
          <div style={S.card}>
            <div style={S.cardTopLine} />
            <div style={S.detailsCardInner}>
              <div style={S.detailsHeader} className="billing-details-header">
                <div>
                  <h2 style={S.detailsTitle}>Billing Details</h2>
                  {selectedDate && (
                    <>
                      <p style={S.detailsSubtitle}>Showing bills for {selectedDate.toLocaleDateString()}</p>
                      <p style={S.detailsMeta}>Total bill no: <strong>{invoices.length}</strong></p>
                    </>
                  )}
                </div>
                <button id="export-pdf-btn" style={S.exportBtn} className="billing-export-btn" onClick={handleExport} disabled={!selectedDate || invoices.length === 0}>
                  Export PDF Report
                </button>
              </div>

              <div style={S.detailsScroll}>
                {loading && <p style={S.status}>Loading invoices...</p>}
                {error && <p style={S.error}>Error: {error}</p>}
                {!loading && selectedDate && invoices.length === 0 && !error && (
                  <p style={S.status}>No bills found for the selected date.</p>
                )}
                {!selectedDate && (
                  <p style={S.status}>Pick a date on the calendar to view billing details.</p>
                )}

                {!loading && selectedDate && invoices.length > 0 && (
                  <>
                    <div style={S.grid}>
                      {paginated.map((inv) => (
                        <div key={inv._id} style={S.billCard}>
                          <div style={S.billCardTop} />
                          <div style={S.billCardInner}>
                            <h3 style={S.buyerHeader}>{inv.buyer?.name || 'Unnamed Buyer'}</h3>
                            <div style={S.invoiceMeta}>
                              <span>Invoice: {inv.invoiceNo}</span>
                              <span>Date: {new Date(inv.invoiceDate).toLocaleDateString()}</span>
                            </div>
                            {inv.buyer?.route && (
                              <div style={S.routeLine}>Route: {inv.buyer.route}</div>
                            )}
                            <table style={S.table}>
                              <thead>
                                <tr>
                                  <th style={S.th}>Product</th>
                                  <th style={S.th}>Qty</th>
                                  <th style={S.th}>Rate</th>
                                  <th style={S.th}>Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {inv.items.map((it, i) => (
                                  <tr key={i}>
                                    <td style={S.td}>{it.particulars}</td>
                                    <td style={S.td}>{it.qty2 ?? it.qty ?? '—'}</td>
                                    <td style={S.td}>{it.rate}</td>
                                    <td style={S.td}>{it.total}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={S.paginationWrapper}>
                      <span style={S.paginationText}>Page {page} of {totalPages}</span>
                      <div style={S.buttonGroup}>
                        <button style={S.button} onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>Prev</button>
                        <button style={S.button} onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages}>Next</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const S = {
  container: {
    maxWidth: '1200px',
  },
  header: { marginBottom: '28px' },
  title: {
    margin: '0 0 4px',
    fontFamily: 'Cormorant Garamond, Georgia, serif',
    fontSize: '2rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    letterSpacing: '0.5px',
  },
  subtitle: { margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem' },
  card: {
    background: 'var(--surface-gradient)',
    borderRadius: '16px',
    border: '1px solid var(--line-medium)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-card)',
    marginBottom: '24px',
  },
  cardTopLine: { height: '1px', background: 'var(--top-line-gradient)' },
  cardInner: { padding: '24px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '0.65rem', fontWeight: 600, color: 'color-mix(in srgb, var(--gold) 60%, transparent)', textTransform: 'uppercase', letterSpacing: '1.5px' },
  detailsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '18px' },
  detailsTitle: { margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' },
  detailsSubtitle: { margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' },
  detailsMeta: { margin: '8px 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' },
  detailsCardInner: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: 'calc(100vh - 260px)', overflow: 'hidden' },
  detailsScroll: { display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '100%' },
  pickerWrapper: { position: 'relative', width: '100%', maxWidth: '420px' },
  input: {
    width: '100%',
    borderRadius: '12px',
    border: '1px solid var(--field-border)',
    background: 'var(--surface-2)',
    color: 'var(--text-primary)',
    padding: '14px 16px',
    fontSize: '0.95rem',
    outline: 'none',
  },
  status: { color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '16px' },
  error: { color: 'var(--ruby)', fontSize: '0.85rem', marginTop: '16px' },
  actionHeader: { display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' },
  exportBtn: {
    padding: '10px 24px',
    borderRadius: '9px',
    background: 'var(--accent-button-bg)',
    border: '1px solid var(--accent-button-border)',
    color: 'var(--gold)',
    fontWeight: 500,
    fontSize: '0.8rem',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-gold)',
    transition: 'all 0.2s',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '10px',
  },
  billCard: {
    background: 'var(--surface-gradient)',
    border: '1px solid var(--line-soft)',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-card)',
  },
  billCardTop: { height: '2px', background: 'var(--top-line-gradient)' },
  billCardInner: { padding: '10px' },
  buyerHeader: {
    margin: '0 0 4px 0',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  invoiceMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.68rem',
    color: 'var(--text-muted)',
    marginBottom: '8px',
    borderBottom: '1px solid var(--line-soft)',
    paddingBottom: '4px',
    gap: '8px',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  routeLine: { margin: '0 0 6px', fontSize: '0.68rem', color: 'var(--text-muted)' },
  th: {
    textAlign: 'left',
    padding: '4px 6px',
    color: 'rgba(59,130,246,0.45)',
    fontSize: '0.54rem',
    letterSpacing: '0.7px',
    textTransform: 'uppercase',
    borderBottom: '1px solid var(--table-row-border)',
  },
  td: {
    padding: '4px 6px',
    borderBottom: '1px solid var(--table-row-border)',
    color: 'var(--text-secondary)',
    fontSize: '0.68rem',
  },
  paginationWrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '18px',
    borderTop: '1px solid var(--line-soft)',
    paddingTop: '12px',
  },
  paginationText: { color: 'var(--text-muted)', fontSize: '0.78rem' },
  buttonGroup: { display: 'flex', gap: '8px' },
  button: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.06)',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontWeight: 500,
    fontSize: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default BillingCalendar;
