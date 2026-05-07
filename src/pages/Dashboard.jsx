import { useState, useEffect } from 'react';
import axios from 'axios';
import { Wallet, List, PieChart, Layers } from 'lucide-react';
import TransactionTable from '../components/TransactionTable';
import SpendingChart from '../components/SpendingChart';
import TransactionFormModal from '../components/TransactionFormModal';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CategoryBudgetManager from '../components/CategoryBudgetManager';
import UserMenu from '../components/UserMenu';
import MonthlyCalendar from '../components/MonthlyCalendar';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('transactions');
  const [balance, setBalance] = useState({ totalIncomes: 0, totalExpenses: 0, balance: 0 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [calendarMonth, setCalendarMonth] = useState(new Date().toISOString().slice(0, 7));

  const fetchBalance = async () => {
    if (!user) return;
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/balance-month?userId=${user.userId}&month=${currentMonth}`);
      setBalance(res.data);
    } catch (err) {
      console.error("Lỗi lấy số dư tháng:", err);
    }
  };

  // Gọi fetchBalance khi user thay đổi hoặc refreshKey thay đổi
  useEffect(() => {
    fetchBalance();
  }, [user, refreshKey]); // ✅ thêm refreshKey

  useEffect(() => {
    if (user) {
      localStorage.setItem('qrUserId', user.userId);
    }
  }, [user]);

  const handleTransactionSaved = () => {
    // Tăng refreshKey để trigger fetchBalance trong useEffect
    setRefreshKey(prev => prev + 1);
  };

  if (!user) return null;

  return (
    <div className="min-vh-100 bg-main pb-5">
      <nav className="navbar shadow-sm mb-4">
        <div className="container py-2 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2 text-primary-blue fw-bold fs-4">
            <Wallet size={28} /> Finance Manager
          </div>
          <UserMenu user={user} onLogout={() => { logout(); navigate('/login'); }} onUpdateUser={(u) => login(u)} />
        </div>
      </nav>

      <div className="container mt-4">
        {/* Dashboard Overview Cards */}
        <div className="row g-4 mb-5">
          <div className="col-md-4">
            <div className="card border-0 shadow-lg p-4 bg-primary-blue text-white h-100 hover-scale">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <small className="text-white-50 fw-bold">SỐ DƯ HIỆN TẠI</small>
                <div className="bg-white bg-opacity-20 p-2 rounded-circle">
                  <Wallet size={20} />
                </div>
              </div>
              <h2 className="fw-bold mb-0">{(balance.balance || 0).toLocaleString()} <small className="fs-6 fw-normal opacity-75">VND</small></h2>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-4 bg-white h-100 hover-scale">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <small className="text-muted fw-bold">THU NHẬP THÁNG</small>
                <div className="bg-success bg-opacity-10 p-2 rounded-circle text-success">
                  <Layers size={20} />
                </div>
              </div>
              <h2 className="fw-bold mb-0 text-main">{(balance.totalIncomes || 0).toLocaleString()}</h2>
              <div className="mt-2 text-success small fw-bold">+ 12% so với tháng trước</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-4 bg-white h-100 hover-scale">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <small className="text-muted fw-bold">CHI TIÊU THÁNG</small>
                <div className="bg-danger bg-opacity-10 p-2 rounded-circle text-danger">
                  <PieChart size={20} />
                </div>
              </div>
              <h2 className="fw-bold mb-0 text-main">{(balance.totalExpenses || 0).toLocaleString()}</h2>
              <div className="mt-2 text-danger small fw-bold">- 5% so với tháng trước</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation (Premium Segmented Control) */}
        <div className="d-flex justify-content-center mb-5">
          <div className="nav-tabs-premium p-1 shadow-sm">
            <button className={`nav-link-premium ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>
              <List size={18} className="me-1" /> Giao dịch
            </button>
            <button className={`nav-link-premium ${activeTab === 'categoriesBudget' ? 'active' : ''}`} onClick={() => setActiveTab('categoriesBudget')}>
              <Layers size={18} className="me-1" /> Ngân sách
            </button>
            <button className={`nav-link-premium ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
              <PieChart size={18} className="me-1" /> Thống kê
            </button>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            {activeTab === 'transactions' && (
              <div className="row g-4">
                <div className="col-lg-8">
                  <div className="card border-0 shadow-sm overflow-hidden">
                    <TransactionTable
                      userId={user.userId}
                      onDataChange={handleTransactionSaved}
                      onEdit={(t) => { setEditingTransaction(t); setModalOpen(true); }}
                      onAdd={() => { setEditingTransaction(null); setModalOpen(true); }}
                      refreshKey={refreshKey}
                    />
                  </div>
                </div>
                <div className="col-lg-4">
                  <div className="card border-0 shadow-sm p-3">
                    <MonthlyCalendar 
                      userId={user.userId} 
                      month={calendarMonth} 
                      onMonthChange={setCalendarMonth} 
                      refreshKey={refreshKey} 
                    />
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'categoriesBudget' && (
              <div className="card border-0 shadow-sm p-4">
                <CategoryBudgetManager userId={user.userId} onDataChange={handleTransactionSaved} />
              </div>
            )}
            {activeTab === 'stats' && (
              <div className="card border-0 shadow-sm p-4">
                <SpendingChart userId={user.userId} />
              </div>
            )}
          </div>
        </div>
      </div>

      <TransactionFormModal userId={user.userId} show={modalOpen} onClose={() => setModalOpen(false)} onTransactionAdded={handleTransactionSaved} editData={editingTransaction} />
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }) => (
  <button className={`btn flex-fill d-flex align-items-center justify-content-center gap-2 py-2 rounded-3 transition-all ${active ? 'btn-primary' : 'btn-light'}`} onClick={onClick}>
    {icon} <span>{label}</span>
  </button>
);

export default Dashboard;