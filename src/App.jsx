import React, { useEffect, useState } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import InvoiceList from './pages/InvoiceList';
import InvoiceForm from './pages/InvoiceForm';
import InvoiceDetail from './pages/InvoiceDetail';
import LoginPage from './pages/LoginPage';
import ProductList from './pages/ProductList';
import ProductForm from './pages/ProductForm';
import CategoryList from './pages/CategoryList';
import BuyerList from './pages/BuyerList';
import BuyerForm from './pages/BuyerForm';
import EmployeeForm from './pages/EmployeeForm';
import EmployeeList from './pages/EmployeeList';
import BillAmountPage from './pages/BillAmountPage';

const routerFutureConfig = {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
};

function App() {
    const Router = window.desktop?.isDesktop ? HashRouter : BrowserRouter;
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user') || 'null');
        } catch {
            return null;
        }
    });

    useEffect(() => {
        if (!token) {
            setSidebarOpen(false);
        }
    }, [token]);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem('theme', theme);
    }, [theme]);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const toggleTheme = () => {
        setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
    };

    const ProtectedRoute = ({ children }) => {
        if (!token) return <Navigate to="/login" />;
        return children;
    };

    return (
        <Router future={routerFutureConfig}>
            <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', background: 'var(--obsidian, #0a0b0d)' }}>
                {token && (
                    <>
                        <Sidebar
                            onLogout={logout}
                            onClose={() => setSidebarOpen(false)}
                            onNavigate={() => setSidebarOpen(false)}
                            isOpen={sidebarOpen}
                            user={user}
                        />
                        <button
                            type="button"
                            className={`app-overlay${sidebarOpen ? ' is-open' : ''}`}
                            aria-label="Close navigation menu"
                            onClick={() => setSidebarOpen(false)}
                        />
                    </>
                )}

                <div className="app-content-shell" style={{
                    flex: 1,
                    marginLeft: token ? '260px' : '0',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '100vh',
                }}>
                    {token && <Navbar onMenuToggle={() => setSidebarOpen((open) => !open)} onThemeToggle={toggleTheme} theme={theme} />}

                    <main className="app-main" style={{
                        padding: '32px',
                        flex: 1,
                        width: '100%',
                        maxWidth: token ? '1200px' : '100%',
                    }}>
                        <Routes>
                            <Route path="/login" element={!token ? <LoginPage setToken={setToken} setUser={setUser} onThemeToggle={toggleTheme} theme={theme} /> : <Navigate to="/" />} />
                            <Route path="/" element={<ProtectedRoute><InvoiceList /></ProtectedRoute>} />
                            <Route path="/new" element={<ProtectedRoute><InvoiceForm /></ProtectedRoute>} />
                            <Route path="/edit/:id" element={<ProtectedRoute><InvoiceForm /></ProtectedRoute>} />
                            <Route path="/invoice/:id" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
                            <Route path="/products" element={<ProtectedRoute><ProductList /></ProtectedRoute>} />
                            <Route path="/products/new" element={<ProtectedRoute><ProductForm /></ProtectedRoute>} />
                            <Route path="/categories" element={<ProtectedRoute><CategoryList /></ProtectedRoute>} />
                            <Route path="/buyers" element={<ProtectedRoute><BuyerList /></ProtectedRoute>} />
                            <Route path="/buyers/new" element={<ProtectedRoute><BuyerForm /></ProtectedRoute>} />
                            <Route path="/employees" element={<ProtectedRoute><EmployeeList /></ProtectedRoute>} />
                            <Route path="/employees/new" element={<ProtectedRoute><EmployeeForm /></ProtectedRoute>} />
                            <Route path="/bill-amount" element={<ProtectedRoute><BillAmountPage /></ProtectedRoute>} />
                            <Route path="/products/edit/:id" element={<ProtectedRoute><ProductForm /></ProtectedRoute>} />
                            <Route path="*" element={<Navigate to="/" />} />
                        </Routes>
                    </main>
                </div>

                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: 'var(--surface)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--line-strong)',
                            borderRadius: '10px',
                            fontSize: '0.83rem',
                            boxShadow: 'var(--shadow-card)',
                        },
                        success: {
                            iconTheme: { primary: 'var(--gold)', secondary: 'var(--surface)' },
                        },
                        error: {
                            iconTheme: { primary: 'var(--ruby)', secondary: 'var(--surface)' },
                        },
                    }}
                />
            </div>
        </Router>
    );
}

export default App;
