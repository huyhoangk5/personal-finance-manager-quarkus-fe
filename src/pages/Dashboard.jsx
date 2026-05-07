import { useState, useEffect } from 'react';
import axios from 'axios';
import { Wallet, List, PieChart, Layers, LogOut, User, Home, PlusCircle, Settings, Edit } from 'lucide-react';
import TransactionTable from '../components/TransactionTable';
import SpendingChart from '../components/SpendingChart';
import TransactionFormModal from '../components/TransactionFormModal';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import CategoryBudgetManager from '../components/CategoryBudgetManager';
import MonthlyCalendar from '../components/MonthlyCalendar';
import EditProfileModal from '../components/EditProfileModal';
import SettingsModal from '../components/SettingsModal';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('transactions');
  const [balance, setBalance] = useState({ totalIncomes: 0, totalExpenses: 0, balance: 0 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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

  useEffect(() => {
    fetchBalance();
  }, [user, refreshKey]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('qrUserId', user.userId);
    }
  }, [user]);

  const handleTransactionSaved = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleProfileUpdated = (updatedUser) => {
    login(updatedUser);
  };

  if (!user) return null;

  return (
    <div className="min-vh-100 bg-main d-flex">
      {/* Sidebar Section */}
      <aside className="sidebar-premium">
        <div className="sidebar-brand">
          <Wallet size={32} />
          <span>Finance</span>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`sidebar-link ${activeTab === 'transactions' ? 'active' : ''}`} 
            onClick={() => setActiveTab('transactions')}
          >
            <List />
            <span>Giao dịch</span>
          </button>
          <button 
            className={`sidebar-link ${activeTab === 'categoriesBudget' ? 'active' : ''}`} 
            onClick={() => setActiveTab('categoriesBudget')}
          >
            <Layers />
            <span>Ngân sách</span>
          </button>
          <button 
            className={`sidebar-link ${activeTab === 'stats' ? 'active' : ''}`} 
            onClick={() => setActiveTab('stats')}
          >
            <PieChart />
            <span>Thống kê</span>
          </button>
          <button 
            className={`sidebar-link ${activeTab === 'account' ? 'active' : ''}`} 
            onClick={() => setActiveTab('account')}
          >
            <User />
            <span>Tài khoản</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-sidebar">
            <div className="user-avatar-sidebar">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <div className="user-info-sidebar overflow-hidden">
              <div className="fw-bold text-truncate" style={{ fontSize: '0.9rem' }}>{user.fullName || user.username}</div>
              <div className="text-white-50 small text-truncate" style={{ fontSize: '0.75rem' }}>{user.email || 'Thành viên'}</div>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="sidebar-link text-danger w-100 border-0">
            <LogOut />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Section */}
      <main className="main-content-with-sidebar flex-grow-1">
        <header className="d-flex justify-content-between align-items-center mb-5">
          <div>
            <h1 className="fw-bold mb-1">Tổng quan tài chính</h1>
            <p className="text-muted mb-0">Chào mừng bạn trở lại, {user.fullName || user.username}!</p>
          </div>
        </header>

        {/* Dashboard Overview Cards */}
        <div className="row g-4 mb-5">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-4 bg-white h-100 border-start border-primary border-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <small className="text-muted fw-bold letter-spacing-1">SỐ DƯ HIỆN TẠI</small>
                <div className="bg-primary bg-opacity-10 p-2 rounded-circle text-primary">
                  <Wallet size={20} />
                </div>
              </div>
              <h2 className="fw-bold mb-0 text-dark">
                {(balance.balance || 0).toLocaleString()} <small className="fs-6 fw-normal opacity-75">VND</small>
              </h2>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-4 bg-white h-100 border-start border-success border-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <small className="text-muted fw-bold letter-spacing-1">THU NHẬP THÁNG</small>
                <div className="bg-success bg-opacity-10 p-2 rounded-circle text-success">
                  <PlusCircle size={20} />
                </div>
              </div>
              <h2 className="fw-bold mb-0 text-dark">{(balance.totalIncomes || 0).toLocaleString()}</h2>
              <div className="mt-2 text-success small fw-bold d-flex align-items-center gap-1">
                 Tăng 12% so với tháng trước
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-4 bg-white h-100 border-start border-danger border-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <small className="text-muted fw-bold letter-spacing-1">CHI TIÊU THÁNG</small>
                <div className="bg-danger bg-opacity-10 p-2 rounded-circle text-danger">
                  <PieChart size={20} />
                </div>
              </div>
              <h2 className="fw-bold mb-0 text-dark">{(balance.totalExpenses || 0).toLocaleString()}</h2>
              <div className="mt-2 text-danger small fw-bold d-flex align-items-center gap-1">
                 Giảm 5% so với tháng trước
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Content Based on activeTab */}
        <div className="row">
          <div className="col-12">
            {activeTab === 'transactions' && (
              <div className="row g-4">
                <div className="col-lg-8">
                  <div className="card border-0 shadow-sm overflow-hidden bg-white">
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
                  <div className="card border-0 shadow-sm p-3 bg-white">
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
              <div className="card border-0 shadow-sm p-4 bg-white">
                <CategoryBudgetManager userId={user.userId} onDataChange={handleTransactionSaved} />
              </div>
            )}
            {activeTab === 'stats' && (
              <div className="card border-0 shadow-sm p-4 bg-white">
                <SpendingChart userId={user.userId} />
              </div>
            )}
            {activeTab === 'account' && (
              <div className="card border-0 shadow-sm p-5 bg-white text-center">
                 <div className="bg-soft-blue rounded-circle d-inline-flex p-4 mb-4 text-primary-blue shadow-sm">
                    <User size={64} />
                 </div>
                 <h2 className="fw-bold text-dark">{user.fullName || user.username}</h2>
                 <p className="text-muted mb-4">{user.email || 'Chưa cập nhật email'}</p>
                 
                 <div className="d-flex justify-content-center gap-3 mb-5">
                    <button onClick={() => setShowEditProfile(true)} className="btn btn-outline-primary d-flex align-items-center gap-2">
                      <Edit size={18} /> Chỉnh sửa hồ sơ
                    </button>
                    <button onClick={() => setShowSettings(true)} className="btn btn-primary-blue d-flex align-items-center gap-2 shadow-sm">
                      <Settings size={18} /> Cài đặt & Bảo mật
                    </button>
                 </div>

                 <hr className="w-50 mx-auto mb-4" />
                 
                 <div className="row justify-content-center">
                    <div className="col-md-6 text-muted small">
                       <p>Quản lý thông tin cá nhân và cài đặt bảo mật của bạn để bảo vệ tài khoản tốt hơn.</p>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <TransactionFormModal userId={user.userId} show={modalOpen} onClose={() => setModalOpen(false)} onTransactionAdded={handleTransactionSaved} editData={editingTransaction} />
      
      <EditProfileModal
        show={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        user={user}
        onUpdate={handleProfileUpdated}
      />
      <SettingsModal
        show={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
};

export default Dashboard;