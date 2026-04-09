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
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-white shadow-sm mb-4">
        <div className="container py-2 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2 text-primary fw-bold fs-4">
            <Wallet /> Finance Manager
          </div>
          <UserMenu user={user} onLogout={() => { logout(); navigate('/login'); }} onUpdateUser={(u) => login(u)} />
        </div>
      </nav>

      <div className="container">
        {/* Dashboard Overview Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-4 bg-success text-white rounded-4">
              <small className="text-white-50 fw-bold">THU TRONG THÁNG</small>
              <h2 className="fw-bold mb-0">{(balance.totalIncomes || 0).toLocaleString()}</h2>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-4 bg-danger text-white rounded-4">
              <small className="text-white-50 fw-bold">CHI TRONG THÁNG</small>
              <h2 className="fw-bold mb-0">{(balance.totalExpenses || 0).toLocaleString()}</h2>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-4 bg-primary text-white rounded-4">
              <small className="text-white-50 fw-bold">SỐ DƯ TRONG THÁNG</small>
              <h2 className="fw-bold mb-0">{(balance.balance || 0).toLocaleString()}</h2>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-2 d-flex gap-2 flex-wrap">
            <TabButton active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<List size={20}/>} label="Giao dịch" />
            <TabButton active={activeTab === 'categoriesBudget'} onClick={() => setActiveTab('categoriesBudget')} icon={<Layers size={20}/>} label="Ngân sách" />
            <TabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<PieChart size={20}/>} label="Thống kê" />
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            {activeTab === 'transactions' && (
              <div className="row g-4">
                <div className="col-lg-7">
                  <TransactionTable
                    userId={user.userId}
                    onDataChange={handleTransactionSaved}
                    onEdit={(t) => { setEditingTransaction(t); setModalOpen(true); }}
                    onAdd={() => { setEditingTransaction(null); setModalOpen(true); }}
                    refreshKey={refreshKey}
                  />
                </div>
                <div className="col-lg-5">
                  <MonthlyCalendar 
                    userId={user.userId} 
                    month={calendarMonth} 
                    onMonthChange={setCalendarMonth} 
                    refreshKey={refreshKey} 
                  />
                </div>
              </div>
            )}
            {activeTab === 'categoriesBudget' && <CategoryBudgetManager userId={user.userId} onDataChange={handleTransactionSaved} />}
            {activeTab === 'stats' && <SpendingChart userId={user.userId} />}
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