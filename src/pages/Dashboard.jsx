import { useState, useEffect } from 'react';
import axios from 'axios';
import { Wallet, List, PieChart, Layers, LogOut, User, PlusCircle, Settings, Edit, ChevronDown, ChevronRight, Sun, Moon, Globe, Key, Shield } from 'lucide-react';
import TransactionTable from '../components/TransactionTable';
import SpendingChart from '../components/SpendingChart';
import TransactionFormModal from '../components/TransactionFormModal';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CategoryBudgetManager from '../components/CategoryBudgetManager';
import MonthlyCalendar from '../components/MonthlyCalendar';
import EditProfileModal from '../components/EditProfileModal';
import SettingsModal from '../components/SettingsModal';
import AdminPanel from '../components/AdminPanel';
import { useToast } from '../context/ToastContext';

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
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().toISOString().slice(0, 7));

  const toast = useToast();
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'vi');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.showToast('error', 'Lỗi', 'Mật khẩu mới không khớp');
      return;
    }
    setLoading(true);
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/users/change-password`, {
        oldPassword,
        newPassword
      });
      toast.showToast('success', 'Thành công', 'Mật khẩu đã được thay đổi');
      setShowChangePassword(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.showToast('error', 'Thất bại', err.response?.data || 'Lỗi');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    if (!user) return;
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/balance-month?month=${currentMonth}`);
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
          <span>WalletZen</span>
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
          {user.role === 'ADMIN' && (
            <button
              className={`sidebar-link ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <Shield />
              <span>Quản lý</span>
            </button>
          )}
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
        <div key={activeTab} className="animate-fade-in">
          {/* Header Section - Hidden on Account / Admin Tab */}
          {activeTab !== 'account' && activeTab !== 'admin' && (
            <header className="d-flex justify-content-between align-items-center mb-5">
              <div>
                <h1 className="fw-bold mb-1">Tổng quan tài chính</h1>
                <p className="text-muted mb-0">Chào mừng bạn trở lại, {user.fullName || user.username}!</p>
              </div>
            </header>
          )}

          {/* Dashboard Overview Cards */}
          {activeTab !== 'account' && activeTab !== 'admin' && (
            <div className="row g-4 mb-5">
              <div className="col-md-4">
                <div className="card border-0 rounded-4 shadow-sm p-4 h-100 aurora-bg" style={{ borderLeft: '4px solid var(--primary-blue)' }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <small className="text-muted fw-bold letter-spacing-1">SỐ DƯ THÁNG NÀY</small>
                    <div className="p-2 rounded-circle" style={{ background: 'var(--accent-blue)', color: 'var(--primary-blue)' }}>
                      <Wallet size={20} />
                    </div>
                  </div>
                  <h2 className="fw-bold mb-0" style={{ color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                    {(balance.balance || 0).toLocaleString('vi-VN')} <small className="fs-6 fw-normal opacity-75">₫</small>
                  </h2>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 rounded-4 shadow-sm p-4 h-100" style={{ borderLeft: '4px solid var(--success)' }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <small className="text-muted fw-bold letter-spacing-1">THU NHẬP THÁNG</small>
                    <div className="p-2 rounded-circle" style={{ background: '#D1FAE5', color: 'var(--success)' }}>
                      <PlusCircle size={20} />
                    </div>
                  </div>
                  <h2 className="fw-bold mb-0" style={{ color: 'var(--success)', letterSpacing: '-0.02em' }}>
                    {(balance.totalIncomes || 0).toLocaleString('vi-VN')} <small className="fs-6 fw-normal opacity-75">₫</small>
                  </h2>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 rounded-4 shadow-sm p-4 h-100" style={{ borderLeft: '4px solid var(--danger)' }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <small className="text-muted fw-bold letter-spacing-1">CHI TIÊU THÁNG</small>
                    <div className="p-2 rounded-circle" style={{ background: '#FFE4E6', color: 'var(--danger)' }}>
                      <PieChart size={20} />
                    </div>
                  </div>
                  <h2 className="fw-bold mb-0" style={{ color: 'var(--danger)', letterSpacing: '-0.02em' }}>
                    {(balance.totalExpenses || 0).toLocaleString('vi-VN')} <small className="fs-6 fw-normal opacity-75">₫</small>
                  </h2>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Content Based on activeTab */}
          <div className="row">
            <div className="col-12">
              {activeTab === 'transactions' && (
                <div className="row g-4">
                  <div className="col-lg-8">
                    <div className="card border-0 rounded-4 shadow-sm overflow-hidden">
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
                    <div className="card border-0 rounded-4 shadow-sm p-3">
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
                <div className="card border-0 rounded-4 shadow-sm p-4">
                  <CategoryBudgetManager userId={user.userId} onDataChange={handleTransactionSaved} />
                </div>
              )}
              {activeTab === 'stats' && (
                <div className="card border-0 p-4">
                  <SpendingChart userId={user.userId} />
                </div>
              )}
              {activeTab === 'account' && (
                <div className="container-fluid py-2">
                  <div className="row justify-content-center">
                    <div className="col-lg-8 col-xl-7">
                      <div className="card border-0 overflow-hidden">
                        {/* Cover strip */}
                        <div style={{ height: '100px', background: 'linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-light) 100%)' }}></div>
                        <div className="card-body p-4 p-md-5 pt-0">
                          {/* Avatar */}
                          <div className="text-center" style={{ marginTop: '-50px' }}>
                            <div className="d-inline-block p-1 rounded-circle mb-3" style={{ background: 'var(--bg-card)', border: '4px solid var(--border-color)' }}>
                              <div className="bg-soft-blue rounded-circle d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                                <User size={48} color="white" />
                              </div>
                            </div>
                            <h3 className="fw-bold mb-1">{user.fullName || user.username}</h3>
                            <p className="text-muted mb-4">{user.email || 'Thành viên'}</p>
                          </div>

                          {/* Detailed Info */}
                          <div className="user-details-grid mt-4">
                            <div className="detail-item py-3 border-bottom">
                              <div className="row align-items-center">
                                <div className="col-sm-4 text-muted small fw-bold text-uppercase">Họ tên</div>
                                <div className="col-sm-8 fw-semibold">{user.fullName || 'Chưa cập nhật'}</div>
                              </div>
                            </div>
                            <div className="detail-item py-3 border-bottom">
                              <div className="row align-items-center">
                                <div className="col-sm-4 text-muted small fw-bold text-uppercase">Email</div>
                                <div className="col-sm-8 fw-semibold">{user.email || 'Chưa cập nhật'}</div>
                              </div>
                            </div>
                            <div className="detail-item py-3 border-bottom">
                              <div className="row align-items-center">
                                <div className="col-sm-4 text-muted small fw-bold text-uppercase">Tài khoản</div>
                                <div className="col-sm-8 fw-semibold">{user.username}</div>
                              </div>
                            </div>
                            <div className="detail-item py-3 border-bottom">
                              <div className="row align-items-center">
                                <div className="col-sm-4 text-muted small fw-bold text-uppercase">Mật khẩu</div>
                                <div className="col-sm-8 d-flex align-items-center gap-3">
                                  <span className="fw-semibold">••••••••</span>
                                  <button
                                    onClick={() => setShowChangePassword(!showChangePassword)}
                                    className="btn btn-sm btn-soft-primary d-flex align-items-center gap-1"
                                  >
                                    <Key size={14} /> {showChangePassword ? 'Hủy' : 'Đổi mật khẩu'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Change Password Form */}
                          {showChangePassword && (
                            <div className="change-password-box mt-3 p-4 rounded-3 animate-fade-in" style={{ background: 'var(--bg-light)' }}>
                              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                                <Key size={18} style={{ color: 'var(--primary-blue)' }} /> Cập nhật mật khẩu mới
                              </h6>
                              <div className="row g-3">
                                <div className="col-12">
                                  <input type="password" className="form-control" placeholder="Mật khẩu cũ" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
                                </div>
                                <div className="col-md-6">
                                  <input type="password" className="form-control" placeholder="Mật khẩu mới" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                                </div>
                                <div className="col-md-6">
                                  <input type="password" className="form-control" placeholder="Xác nhận mật khẩu mới" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                                </div>
                                <div className="col-12">
                                  <button className="btn btn-primary w-100 py-2 fw-bold" onClick={handleChangePassword} disabled={loading}>
                                    {loading ? <span className="spinner-border spinner-border-sm"></span> : 'Lưu mật khẩu mới'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="mt-4 pt-2 d-flex flex-wrap gap-3">
                            <button onClick={() => setShowEditProfile(true)} className="btn btn-primary px-4 py-2 d-flex align-items-center gap-2 rounded-3">
                              <Edit size={18} /> Chỉnh sửa hồ sơ
                            </button>
                          </div>

                          {/* Settings Dropdown */}
                          <div className="settings-section mt-5 pt-3 border-top">
                            <button
                              onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                              className="btn btn-link text-decoration-none fw-bold d-flex align-items-center justify-content-between w-100 p-0"
                              style={{ color: 'var(--text-main)' }}
                            >
                              <span className="d-flex align-items-center gap-2">
                                <Settings size={20} className="text-muted" /> Cài đặt & Tùy chỉnh
                              </span>
                              {showSettingsDropdown ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                            </button>

                            {showSettingsDropdown && (
                              <div className="mt-4 animate-fade-in">
                                <div className="settings-card p-4 rounded-4 border-0" style={{ background: 'var(--bg-light)' }}>

                                  <div className="mb-0">
                                    <label className="form-label fw-bold d-flex align-items-center gap-2 mb-3 text-muted small text-uppercase letter-spacing-1">
                                      <Globe size={18} /> Ngôn ngữ
                                    </label>
                                    <select className="form-select border-0 shadow-sm py-2 rounded-3" value={language} onChange={e => setLanguage(e.target.value)}>
                                      <option value="vi">Tiếng Việt</option>
                                      <option value="en">English</option>
                                      <option value="fr">Français</option>
                                      <option value="ja">日本語</option>
                                    </select>
                                    <div className="mt-2 text-muted" style={{ fontSize: '0.75rem' }}>
                                      * Chức năng đa ngôn ngữ đang trong quá trình phát triển
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'admin' && user.role === 'ADMIN' && (
                <div className="mt-4">
                  <AdminPanel />
                </div>
              )}
            </div>
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
