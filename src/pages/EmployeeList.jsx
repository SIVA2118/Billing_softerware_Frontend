import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fetchEmployees, deleteEmployee } from '../api/authApi';

export default function EmployeeList() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        try {
            const res = await fetchEmployees();
            setEmployees(res.data?.data || []);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (emp) => {
        if (!window.confirm(`Delete employee "${emp.username}" (${emp.employeeId})?`)) return;
        try {
            await deleteEmployee(emp._id);
            toast.success('Employee deleted successfully');
            setEmployees((prev) => prev.filter((e) => e._id !== emp._id));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete employee');
        }
    };

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return employees;
        return employees.filter((emp) =>
            String(emp.employeeId || '').toLowerCase().includes(q) ||
            String(emp.username || '').toLowerCase().includes(q)
        );
    }, [employees, query]);

    return (
        <div className="page-shell" style={S.container}>
            <div className="page-header" style={S.header}>
                <div>
                    <h1 className="page-title-display" style={S.title}>Employee List</h1>
                    <p style={S.subtitle}>View and search all employees</p>
                </div>
                <Link to="/employees/new" style={S.addBtn}>+ Add Employee</Link>
            </div>

            <div className="toolbar-row" style={S.toolbar}>
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by Employee ID or Username"
                    style={S.searchInput}
                />
                <span style={S.countBadge}>{filtered.length}</span>
            </div>

            <div style={S.card}>
                <div style={S.cardTopLine} />
                <div style={S.cardInner}>
                    {loading && <div style={S.stateText}>Loading employees...</div>}

                    {!loading && filtered.length === 0 && (
                        <div style={S.emptyState}>
                            <div style={S.emptyIcon}>◌</div>
                            <p style={S.emptyText}>No employees found.</p>
                        </div>
                    )}

                    {!loading && filtered.length > 0 && (
                        <div className="table-scroll">
                            <table style={S.table}>
                                <thead>
                                    <tr style={S.theadRow}>
                                        <th style={S.th}>Employee ID</th>
                                        <th style={S.th}>Username</th>
                                        <th style={S.th}>Role</th>
                                        <th style={S.th}>Created</th>
                                        <th style={S.th}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((emp) => (
                                        <tr key={emp._id} style={S.tr}>
                                            <td style={S.td}><span style={S.idChip}>{emp.employeeId || '-'}</span></td>
                                            <td style={S.tdStrong}>{emp.username}</td>
                                            <td style={S.td}>{emp.role}</td>
                                            <td style={S.td}>{emp.createdAt ? new Date(emp.createdAt).toLocaleDateString('en-IN') : '-'}</td>
                                            <td style={S.td}>
                                                <div className="inline-actions" style={{ display: 'flex', gap: '6px' }}>
                                                    <button
                                                        onClick={() => navigate(`/?employee=${encodeURIComponent(emp.employeeId)}`)}
                                                        style={S.billsBtn}
                                                    >
                                                        Bills
                                                    </button>
                                                    <button onClick={() => handleDelete(emp)} style={S.deleteBtn}>Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const S = {
    container: { maxWidth: '980px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' },
    title: {
        margin: '0 0 4px',
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.5px',
    },
    subtitle: { margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem' },
    addBtn: {
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        background: 'var(--accent-button-bg)',
        border: '1px solid var(--accent-button-border)', color: 'var(--gold)',
        padding: '9px 20px', borderRadius: '9px',
        fontWeight: 500, fontSize: '0.8rem', letterSpacing: '0.3px',
        textDecoration: 'none',
    },
    toolbar: { display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px' },
    searchInput: {
        flex: 1, padding: '10px 12px',
        background: 'var(--field-bg)',
        border: '1px solid var(--field-border)', borderRadius: '8px',
        fontSize: '0.83rem', color: 'var(--text-primary)', outline: 'none',
    },
    countBadge: {
        minWidth: '38px', textAlign: 'center',
        background: 'rgba(59,130,246,0.08)', color: '#3b82f6',
        border: '1px solid rgba(59,130,246,0.15)', borderRadius: '20px',
        padding: '4px 10px', fontSize: '0.74rem', fontWeight: 600,
    },
    card: {
        background: 'var(--surface-gradient)',
        borderRadius: '16px', border: '1px solid var(--line-soft)',
        overflow: 'hidden', boxShadow: 'var(--shadow-card)',
    },
    cardTopLine: { height: '1px', background: 'var(--top-line-gradient)' },
    cardInner: { padding: '20px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    theadRow: { borderBottom: '1px solid var(--line-medium)' },
    th: {
        padding: '10px 10px', textAlign: 'left',
        fontSize: '0.62rem', fontWeight: 700, letterSpacing: '1.4px', textTransform: 'uppercase',
        color: 'color-mix(in srgb, var(--gold) 50%, transparent)',
    },
    tr: { borderBottom: '1px solid var(--table-row-border)' },
    td: { padding: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)' },
    tdStrong: { padding: '10px', fontSize: '0.84rem', color: 'var(--text-primary)', fontWeight: 500 },
    idChip: {
        background: 'rgba(59,130,246,0.08)', color: '#3b82f6',
        border: '1px solid rgba(59,130,246,0.18)', borderRadius: '16px',
        padding: '3px 9px', fontSize: '0.72rem', fontWeight: 600,
    },
    billsBtn: {
        background: 'rgba(59,130,246,0.08)', color: '#3b82f6',
        border: '1px solid rgba(59,130,246,0.2)', borderRadius: '7px',
        padding: '4px 12px', fontSize: '0.74rem', fontWeight: 600,
        cursor: 'pointer',
    },
    deleteBtn: {
        background: 'rgba(220,53,69,0.12)', color: '#e05c6a',
        border: '1px solid rgba(220,53,69,0.25)', borderRadius: '7px',
        padding: '4px 12px', fontSize: '0.74rem', fontWeight: 600,
        cursor: 'pointer',
    },
    stateText: { color: 'var(--text-muted)', fontSize: '0.82rem' },
    emptyState: { textAlign: 'center', padding: '56px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' },
    emptyIcon: { fontSize: '1.8rem', color: 'rgba(59,130,246,0.25)' },
    emptyText: { color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 },
};
