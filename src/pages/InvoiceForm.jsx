import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createInvoice, fetchInvoice, fetchInvoices, updateInvoice } from '../api/invoiceApi';
import { fetchBuyers } from '../api/buyerApi.js';
import { fetchProducts } from '../api/productApi';
import { fetchEmployees } from '../api/authApi';

const EMPTY_ITEM = { slNo: 1, particulars: '', qty: '', rate: '', grossAmt: '', cgstPct: 20, cgstAmt: '', sgstPct: 20, sgstAmt: '', total: '' };
const DEFAULT_SELLER = { name: 'Shri Sastik Agencies', address: '2/572 Q2, Mudalaipalayam, Kangeyam Road (Via)', city: 'Tirupur', state: 'Tamil Nadu', pincode: '641606', phone: '7904125248', gstin: '33AFIFS1793R1Z6', fssaiNo: '12424027000669', pan: 'AFIFS1793R' };
const EMPTY_BUYER = { name: '', address: '', route: '', phone: '' };

const toNumber = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
const parseSeq = (no) => { const m = String(no || '').match(/(\d+)$/); return m ? Number(m[1]) : 0; };
const genInvoiceNo = (n) => { const now = new Date(); const s = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1; return `${s}-${String((s + 1) % 100).padStart(2, '0')}/${String(n).padStart(4, '0')}`; };

export default function InvoiceForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [seller, setSeller] = useState(DEFAULT_SELLER);
    const [buyer, setBuyer] = useState(EMPTY_BUYER);
    const [buyers, setBuyers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedBuyerId, setSelectedBuyerId] = useState('');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [meta, setMeta] = useState({
        invoiceNo: '',
        invoiceDate: new Date().toISOString().slice(0, 10),
    });
    const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
    const [saving, setSaving] = useState(false);
    const [currentUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user') || 'null');
        } catch {
            return null;
        }
    });

    useEffect(() => {
        fetchBuyers().then(r => setBuyers(r.data.data)).catch(() => toast.error('Failed to load buyers'));
        fetchEmployees().then(r => {
            const list = r.data?.data || [];
            setEmployees(list);
            if (!isEdit && currentUser?.role === 'employee' && currentUser?.employeeId) {
                setSelectedEmployeeId(currentUser.employeeId);
            }
        }).catch(() => toast.error('Failed to load employees'));
        fetchProducts().then(r => setProducts(r.data.data)).catch(() => toast.error('Failed to load products'));
        if (!isEdit) {
            fetchInvoices().then(r => {
                const max = (r.data?.data || []).reduce((m, i) => Math.max(m, parseSeq(i.invoiceNo)), 0);
                setMeta(p => p.invoiceNo ? p : { ...p, invoiceNo: genInvoiceNo(max + 1) });
            }).catch(() => {});
        }
    }, [isEdit]);

    useEffect(() => {
        if (!isEdit) return;
        fetchInvoice(id).then(r => {
            const d = r.data.data;
            setSeller(d.seller || DEFAULT_SELLER);
            setBuyer(d.buyer || EMPTY_BUYER);
            setMeta({
                invoiceNo: d.invoiceNo,
                invoiceDate: d.invoiceDate?.slice(0, 10),
            });
            setItems(d.items || []);
            setSelectedEmployeeId(d.employeeId || '');
        }).catch(() => toast.error('Failed to load invoice'));
    }, [id, isEdit]);

    useEffect(() => {
        if (!buyers.length || !buyer.name || selectedBuyerId) return;
        const m = buyers.find(b => b.name === buyer.name);
        if (m) setSelectedBuyerId(m._id);
    }, [buyers, buyer.name, selectedBuyerId]);

    const recalc = (item) => {
        const qty = toNumber(item.qty), rate = toNumber(item.rate);
        const gross = qty > 0 && rate > 0 ? qty * rate : toNumber(item.grossAmt);
        const cgst = parseFloat(((gross * toNumber(item.cgstPct)) / 100).toFixed(2));
        const sgst = parseFloat(((gross * toNumber(item.sgstPct)) / 100).toFixed(2));
        return { ...item, grossAmt: parseFloat(gross.toFixed(2)), cgstAmt: cgst, sgstAmt: sgst, total: parseFloat((gross + cgst + sgst).toFixed(2)) };
    };

    const getProduct = (val) => {
        const v = String(val || '').trim().toLowerCase();
        return v ? products.find(p => String(p.particulars || p.name || '').trim().toLowerCase() === v) || null : null;
    };

    const validateItems = () => {
        for (let i = 0; i < items.length; i += 1) {
            const item = items[i] || {};
            const row = i + 1;
            const name = String(item.particulars || '').trim();
            const qty = toNumber(item.qty);
            const rate = toNumber(item.rate);

            if (!name) {
                toast.error(`Item ${row}: Product name is required`);
                return false;
            }

            if (qty <= 0) {
                toast.error(`Item ${row}: Qty must be greater than 0`);
                return false;
            }

            if (rate <= 0) {
                toast.error(`Item ${row}: Rate must be greater than 0`);
                return false;
            }

            const matchedProduct = getProduct(name);
            if (matchedProduct) {
                const availableQty = toNumber(matchedProduct.qty);
                if (availableQty <= 0) {
                    toast.error(`Unavailable product: ${name} is out of stock`);
                    return false;
                }
                if (qty > availableQty) {
                    toast.error(`Unavailable qty for ${name}. Available: ${availableQty}`);
                    return false;
                }
            }
        }

        return true;
    };

    const handleItemChange = (idx, field, val) => {
        setItems(prev => {
            const up = [...prev];
            const next = { ...up[idx], [field]: val };
            if (field === 'particulars') {
                const prod = getProduct(val);
                up[idx] = prod ? recalc({ ...next, qty: prod.qty || '', rate: prod.rate ?? prod.unitPrice ?? '', grossAmt: prod.grossAmt ?? '', cgstPct: prod.cgstPct ?? ((prod.taxRate ?? 0) / 2), sgstPct: prod.sgstPct ?? ((prod.taxRate ?? 0) / 2) }) : recalc(next);
            } else { up[idx] = recalc(next); }
            return up;
        });
    };

    const handleBuyerSelect = (bid) => {
        setSelectedBuyerId(bid);
        const b = buyers.find(x => x._id === bid);
        setBuyer(b ? { name: b.name || '', address: b.address || '', route: b.route || '', phone: b.phone || '' } : EMPTY_BUYER);
    };

    const handleBuyerSearchChange = (val) => {
        const input = String(val || '').trim();
        const matchedBuyer = buyers.find(
            (b) => String(b.name || '').trim().toLowerCase() === input.toLowerCase()
        );

        if (matchedBuyer) {
            handleBuyerSelect(matchedBuyer._id);
            return;
        }

        setSelectedBuyerId('');
        setBuyer((prev) => ({
            ...prev,
            name: input,
            address: input ? prev.address : '',
            route: input ? prev.route : '',
            phone: input ? prev.phone : '',
        }));
    };

    const handleBuyerField = (field, val) => { if (selectedBuyerId) setSelectedBuyerId(''); setBuyer(p => ({ ...p, [field]: val })); };

    const totalUnits = items.reduce((s, i) => s + (parseFloat(i.grossAmt) || 0), 0);
    const totalTax = items.reduce((s, i) => s + (parseFloat(i.cgstAmt) || 0) + (parseFloat(i.sgstAmt) || 0), 0);
    const net = totalUnits + totalTax;
    const rounded = Math.round(net) - net;
    const grandTotal = Math.round(net);
    const inferredAdminId = !currentUser?.Adminid && /^AD-\d{8}-\d{3}$/i.test(String(currentUser?.employeeId || ''))
        ? currentUser?.employeeId
        : '';
    const currentAdminId = currentUser?.Adminid || inferredAdminId || '';
    const resolvedEmployeeId = selectedEmployeeId || (currentUser?.role === 'employee' ? (currentUser?.employeeId || '') : '');
    const selectedEmployee = employees.find((e) => e.employeeId === resolvedEmployeeId);

    const handleSubmit = async () => {
        if (!meta.invoiceNo || !meta.invoiceDate) return toast.error('Invoice No and Date required');
        if (!resolvedEmployeeId) return toast.error('Employee ID is required. Please login again or contact admin.');
        if (currentUser?.role === 'admin' && !selectedEmployee) return toast.error('Please select a valid Employee ID from the list.');
        if (!seller.name) return toast.error('Seller name required');
        if (!buyer.name) return toast.error('Buyer name required');
        if (!items.length) return toast.error('Add at least one item');
        if (!validateItems()) return;
        setSaving(true);
        try {
            const payload = {
                seller,
                buyer,
                ...meta,
                items,
                employeeId: resolvedEmployeeId,
                employeeName: selectedEmployee?.username || currentUser?.username || '',
            };
            if (isEdit) { await updateInvoice(id, payload); toast.success('Invoice updated'); }
            else { await createInvoice(payload); toast.success('Invoice created'); }
            navigate('/');
        } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
        finally { setSaving(false); }
    };

    return (
        <div className="page-shell" style={{ maxWidth: '1100px' }}>
            <div className="page-header" style={S.pageHeader}>
                <div>
                    <h1 className="page-title-display" style={S.pageTitle}>{isEdit ? 'Edit Invoice' : 'New Invoice'}</h1>
                    <p style={S.pageSub}>{isEdit ? `Editing ${meta.invoiceNo}` : 'Create a new tax invoice'}</p>
                </div>
                <div className="page-header-actions">
                    <button onClick={() => navigate('/')} style={S.btnBack}>← Back</button>
                </div>
            </div>

            <Section title="Invoice Details">
                <div className="responsive-grid-2" style={S.grid2}>
                    <Field label="Invoice No" value={meta.invoiceNo} onChange={v => setMeta(p => ({ ...p, invoiceNo: v }))} required />
                    <Field label="Invoice Date" type="date" value={meta.invoiceDate} onChange={v => setMeta(p => ({ ...p, invoiceDate: v }))} required />
                    {currentUser?.role === 'admin' && (
                        <Field label="Adminid" value={currentAdminId || 'Not assigned'} readOnly />
                    )}
                    <div>
                        <label style={S.fieldLabel}>Employee ID<span style={{ color: 'rgba(248,113,113,0.5)' }}> *</span></label>
                        <input
                            list="employee-id-list"
                            value={resolvedEmployeeId}
                            onChange={(e) => setSelectedEmployeeId(e.target.value.trim().toUpperCase())}
                            readOnly={currentUser?.role === 'employee'}
                            placeholder="Search employee ID"
                            style={S.inp}
                        />
                        <datalist id="employee-id-list">
                            {employees.map((emp) => (
                                <option key={emp._id} value={emp.employeeId}>{`${emp.employeeId} - ${emp.username}`}</option>
                            ))}
                        </datalist>
                        {selectedEmployee?.username && <div style={S.helperText}>Employee: {selectedEmployee.username}</div>}
                    </div>
                </div>
            </Section>

            <Section title="Seller Details">
                <div className="responsive-grid-3" style={S.grid3}>
                    <Field label="Seller Name" value={seller.name} onChange={v => setSeller(p => ({ ...p, name: v }))} required />
                    <Field label="Address" value={seller.address} onChange={v => setSeller(p => ({ ...p, address: v }))} />
                    <Field label="City" value={seller.city} onChange={v => setSeller(p => ({ ...p, city: v }))} />
                    <Field label="State" value={seller.state} onChange={v => setSeller(p => ({ ...p, state: v }))} />
                    <Field label="Pincode" value={seller.pincode} onChange={v => setSeller(p => ({ ...p, pincode: v }))} />
                    <Field label="Phone" value={seller.phone} onChange={v => setSeller(p => ({ ...p, phone: v }))} />
                    <Field label="GSTIN" value={seller.gstin} onChange={v => setSeller(p => ({ ...p, gstin: v }))} />
                    <Field label="FSSAI No" value={seller.fssaiNo} onChange={v => setSeller(p => ({ ...p, fssaiNo: v }))} />
                    <Field label="PAN" value={seller.pan} onChange={v => setSeller(p => ({ ...p, pan: v }))} />
                </div>
            </Section>

            <Section title="Buyer Details">
                <div className="responsive-grid-2" style={S.grid2}>
                    <div>
                        <label style={S.fieldLabel}>Select Saved Buyer</label>
                        <input
                            list="buyer-list"
                            style={S.inp}
                            value={buyer.name}
                            onChange={(e) => handleBuyerSearchChange(e.target.value)}
                            placeholder="Search buyer name"
                        />
                        <datalist id="buyer-list">
                            {buyers.map((b) => (
                                <option key={b._id} value={b.name}>{`${b.name}${b.route ? ` - ${b.route}` : ''}`}</option>
                            ))}
                        </datalist>
                        <div style={S.helperRow}>
                            <Link to="/buyers" style={S.helperLink}>Manage buyers</Link>
                        </div>
                    </div>
                    <div />
                    <Field label="Buyer Name" value={buyer.name} onChange={v => handleBuyerField('name', v)} required />
                    <Field label="Address" value={buyer.address} onChange={v => handleBuyerField('address', v)} />
                    <Field label="Route" value={buyer.route} onChange={v => handleBuyerField('route', v)} />
                    <Field label="Phone" value={buyer.phone} onChange={v => handleBuyerField('phone', v)} />
                </div>
            </Section>

            <Section title="Items">
                <div className="table-scroll table-scroll-wide">
                    <table style={S.table}>
                        <thead>
                            <tr style={S.theadRow}>
                                {['#', 'Particulars', 'Qty', 'Rate', 'Gross Amt', 'CGST%', 'CGST ₹', 'SGST%', 'SGST ₹', 'Total', ''].map(h => (
                                    <th key={h} style={S.th}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={idx} style={{ ...S.tr, background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                                    <td style={S.td}><span style={S.slno}>{idx + 1}</span></td>
                                    <td style={S.td}>
                                        <input
                                            list={`prod-${idx}`}
                                            style={{ ...S.inp, minWidth: '150px' }}
                                            value={item.particulars}
                                            onChange={e => handleItemChange(idx, 'particulars', e.target.value)}
                                            placeholder="Product name"
                                        />
                                        <datalist id={`prod-${idx}`}>
                                            {products.map(p => <option key={p._id} value={p.particulars || p.name || ''} />)}
                                        </datalist>
                                    </td>
                                    <td style={S.td}><input style={{ ...S.inp, width: '80px' }} value={item.qty} onChange={e => handleItemChange(idx, 'qty', e.target.value)} placeholder="2 CS30" /></td>
                                    <td style={S.td}><input style={{ ...S.inp, width: '80px' }} type="number" value={item.rate} onChange={e => handleItemChange(idx, 'rate', e.target.value)} /></td>
                                    <td style={S.td}><input style={{ ...S.inp, width: '90px' }} type="number" value={item.grossAmt} onChange={e => handleItemChange(idx, 'grossAmt', e.target.value)} /></td>
                                    <td style={S.td}><span style={S.calcVal}>{item.cgstPct || 0}%</span></td>
                                    <td style={S.td}><span style={S.calcVal}>₹{item.cgstAmt || 0}</span></td>
                                    <td style={S.td}><span style={S.calcVal}>{item.sgstPct || 0}%</span></td>
                                    <td style={S.td}><span style={S.calcVal}>₹{item.sgstAmt || 0}</span></td>
                                    <td style={S.td}><span style={S.totalVal}>₹{item.total || 0}</span></td>
                                    <td style={S.td}>
                                        {items.length > 1 && (
                                            <button onClick={() => setItems(p => p.filter((_, i) => i !== idx).map((it, i) => ({ ...it, slNo: i + 1 })))} style={S.btnRemove}>✕</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <button onClick={() => setItems(p => [...p, { ...EMPTY_ITEM, slNo: p.length + 1 }])} style={S.btnAddItem}>
                    + Add Item
                </button>
            </Section>

            <Section title="Summary">
                <div className="responsive-summary-panel" style={S.totalsBox}>
                    {[
                        ['Total (units)', totalUnits.toFixed(2), false, false],
                        ['Total Discount', '0.00', false, false],
                        ['Total Tax', totalTax.toFixed(2), false, false],
                        ['Net Amount', net.toFixed(2), false, false],
                        ['Rounded Off', rounded.toFixed(2), false, false],
                    ].map(([l, v]) => (
                        <div key={l} style={S.summaryRow}>
                            <span style={S.summaryLabel}>{l}</span>
                            <span style={S.summaryVal}>₹{v}</span>
                        </div>
                    ))}
                    <div style={S.grandRow}>
                        <span style={S.grandLabel}>GRAND TOTAL</span>
                        <span style={S.grandVal}>₹{grandTotal.toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </Section>

            <div className="form-actions" style={S.formActions}>
                <button onClick={() => navigate('/')} style={S.btnCancel}>Cancel</button>
                <button onClick={handleSubmit} disabled={saving} style={S.btnSave}>
                    {saving ? 'Saving…' : isEdit ? 'Update Invoice' : 'Save Invoice'}
                </button>
            </div>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <div style={S.section}>
            <div style={S.sectionHeader}>
                <span style={S.sectionTitle}>{title}</span>
                <div style={S.sectionLine} />
            </div>
            <div style={S.sectionBody}>{children}</div>
        </div>
    );
}

function Field({ label, value, onChange, type = 'text', placeholder = '', required, readOnly = false }) {
    return (
        <div>
            <label style={S.fieldLabel}>{label}{required && <span style={{ color: 'rgba(248,113,113,0.5)' }}> *</span>}</label>
            <input
                type={type} value={value || ''}
                onChange={e => onChange && onChange(e.target.value)}
                placeholder={placeholder}
                readOnly={readOnly}
                style={S.inp}
            />
        </div>
    );
}

const S = {
    pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' },
    pageTitle: {
        margin: '0 0 4px',
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.5px',
    },
    pageSub: { margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem' },
    btnBack: {
        background: 'transparent', border: '1px solid var(--muted-border)',
        color: 'var(--text-muted)', padding: '9px 18px', borderRadius: '9px',
        fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', letterSpacing: '0.3px',
    },
    section: {
        background: 'var(--surface-gradient)',
        borderRadius: '14px', border: '1px solid var(--line-soft)',
        marginBottom: '16px', overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
    },
    sectionHeader: {
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '14px 22px',
        borderBottom: '1px solid var(--line-soft)',
        background: 'color-mix(in srgb, var(--gold) 4%, transparent)',
    },
    sectionTitle: {
        fontSize: '0.65rem', fontWeight: 700, color: 'color-mix(in srgb, var(--gold) 60%, transparent)',
        letterSpacing: '2px', textTransform: 'uppercase', whiteSpace: 'nowrap',
    },
    sectionLine: { flex: 1, height: '1px', background: 'var(--line-soft)' },
    sectionBody: { padding: '22px' },
    grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' },
    grid3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' },
    fieldLabel: { display: 'block', fontSize: '0.62rem', fontWeight: 600, color: 'color-mix(in srgb, var(--gold) 55%, transparent)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '6px' },
    inp: {
        padding: '10px 12px', width: '100%',
        background: 'var(--field-bg)',
        border: '1px solid var(--field-border)',
        borderRadius: '8px', fontSize: '0.83rem', color: 'var(--text-primary)', outline: 'none',
    },
    helperRow: { marginTop: '6px' },
    helperLink: { fontSize: '0.72rem', color: 'color-mix(in srgb, var(--gold) 60%, transparent)', fontWeight: 500 },
    helperText: { marginTop: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    theadRow: { borderBottom: '1px solid var(--line-medium)', background: 'color-mix(in srgb, var(--gold) 5%, transparent)' },
    th: { padding: '10px 8px', textAlign: 'left', fontSize: '0.58rem', fontWeight: 700, color: 'color-mix(in srgb, var(--gold) 50%, transparent)', letterSpacing: '1.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' },
    tr: { borderBottom: '1px solid var(--table-row-border)' },
    td: { padding: '7px 4px', verticalAlign: 'middle' },
    slno: {
        width: '24px', height: '24px', borderRadius: '50%',
        background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.62rem', fontWeight: 700, color: 'rgba(201,168,76,0.5)',
    },
    calcVal: { color: 'rgba(201,168,76,0.6)', fontWeight: 600, fontSize: '0.78rem' },
    totalVal: { color: '#34d399', fontWeight: 600, fontSize: '0.82rem' },
    btnRemove: {
        background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.12)',
        color: 'rgba(248,113,113,0.6)', borderRadius: '6px', padding: '4px 8px',
        fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
    },
    btnAddItem: {
        marginTop: '14px',
        background: 'var(--gold-dim)', border: '1px dashed var(--line-strong)',
        color: 'color-mix(in srgb, var(--gold) 70%, transparent)', padding: '9px 18px', borderRadius: '8px',
        fontWeight: 500, fontSize: '0.78rem', letterSpacing: '0.5px', cursor: 'pointer',
    },
    totalsBox: { maxWidth: '320px', marginLeft: 'auto' },
    summaryRow: { display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--table-row-border)' },
    summaryLabel: { fontSize: '0.75rem', color: 'var(--text-muted)' },
    summaryVal: { fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 },
    grandRow: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', marginTop: '10px',
        background: 'var(--gold-dim)', border: '1px solid var(--line-strong)',
        borderRadius: '10px',
    },
    grandLabel: { fontSize: '0.62rem', fontWeight: 700, color: 'color-mix(in srgb, var(--gold) 70%, transparent)', letterSpacing: '2px', textTransform: 'uppercase' },
    grandVal: { fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.2rem', fontWeight: 600, color: 'var(--gold)' },
    formActions: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '20px' },
    btnCancel: {
        padding: '11px 24px', borderRadius: '9px',
        background: 'transparent', border: '1px solid var(--muted-border)',
        color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.82rem', letterSpacing: '0.3px', cursor: 'pointer',
    },
    btnSave: {
        padding: '11px 28px', borderRadius: '9px',
        background: 'var(--accent-button-bg)',
        border: '1px solid var(--accent-button-border)', color: 'var(--gold)',
        fontWeight: 500, fontSize: '0.82rem', letterSpacing: '0.5px', cursor: 'pointer',
        boxShadow: 'var(--shadow-gold)',
    },
};
