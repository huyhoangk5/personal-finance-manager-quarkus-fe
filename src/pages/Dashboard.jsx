import { useState, useEffect } from 'react';
import axios from 'axios';
import { Wallet, List, PieChart, Layers, LogOut, User, Home, PlusCircle, Settings, Edit, ChevronDown, ChevronRight, Sun, Moon, Globe, Key, Eye, EyeOff } from 'lucide-react';
import TransactionTable from '../components/TransactionTable';
import SpendingChart from '../components/SpendingChart';
import TransactionFormModal from '../components/TransactionFormModal';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import CategoryBudgetManager from '../components/CategoryBudgetManager';
import MonthlyCalendar from '../components/MonthlyCalendar';
import EditProfileModal from '../components/EditProfileModal';
import SettingsModal from '../components/SettingsModal';
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
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'vi');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-bs-theme', 'light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

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
        userId: user.userId,
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
        {/* Header Section - Hidden on Account Tab */}
        {activeTab !== 'account' && (
          <header className="d-flex justify-content-between align-items-center mb-5">
            <div>
              <h1 className="fw-bold mb-1">Tổng quan tài chính</h1>
              <p className="text-muted mb-0">Chào mừng bạn trở lại, {user.fullName || user.username}!</p>
            </div>
          </header>
        )}

        {/* Dashboard Overview Cards - Hidden on Account Tab */}
        {activeTab !== 'account' && (
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
        )}

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
              <div className="container-fluid py-2">
                <div className="row justify-content-center">
                  <div className="col-lg-8 col-xl-7">
                    <div className="card border-0 shadow-premium rounded-4 overflow-hidden bg-white">
                      {/* Cover Color Strip */}
                      <div className="bg-primary-blue" style={{ height: '100px' }}></div>
                      
                      <div className="card-body p-4 p-md-5 pt-0">
                        {/* Avatar Section */}
                        <div className="text-center" style={{ marginTop: '-50px' }}>
                          <div className="avatar-container-premium d-inline-block p-1 bg-white rounded-circle shadow-sm mb-3">
                            <div className="bg-soft-blue rounded-circle d-flex align-items-center justify-content-center text-primary-blue" style={{ width: '100px', height: '100px' }}>
                              <User size={48} />
                            </div>
                          </div>
                          <h3 className="fw-bold text-dark mb-1">{user.fullName || user.username}</h3>
                          <p className="text-muted mb-4">{user.email || 'Thành viên'}</p>
                        </div>

                        {/* Detailed Information */}
                        <div className="user-details-grid mt-4">
                          <div className="detail-item py-3 border-bottom">
                            <div className="row align-items-center">
                              <div className="col-sm-4 text-muted small fw-bold text-uppercase">Họ tên</div>
                              <div className="col-sm-8 fw-semibold text-dark">{user.fullName || 'Chưa cập nhật'}</div>
                            </div>
                          </div>
                          
                          <div className="detail-item py-3 border-bottom">
                            <div className="row align-items-center">
                              <div className="col-sm-4 text-muted small fw-bold text-uppercase">Email</div>
                              <div className="col-sm-8 fw-semibold text-dark">{user.email || 'Chưa cập nhật'}</div>
                            </div>
                          </div>

                          <div className="detail-item py-3 border-bottom">
                            <div className="row align-items-center">
                              <div className="col-sm-4 text-muted small fw-bold text-uppercase">Tài khoản</div>
                              <div className="col-sm-8 fw-semibold text-dark">{user.username}</div>
                            </div>
                          </div>

                          <div className="detail-item py-3 border-bottom">
                            <div className="row align-items-center">
                              <div className="col-sm-4 text-muted small fw-bold text-uppercase">Mật khẩu</div>
                              <div className="col-sm-8 d-flex align-items-center gap-3">
                                <span className="fw-semibold text-dark">••••••••</span>
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

                        {/* Change Password Form (Inline) */}
                        {showChangePassword && (
                          <div className="change-password-box mt-3 p-4 bg-light rounded-3 animate-fade-in">
                            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                              <Key size={18} className="text-primary" /> Cập nhật mật khẩu mới
                            </h6>
                            <div className="row g-3">
                              <div className="col-12">
                                <input 
                                  type="password" 
                                  className="form-control" 
                                  placeholder="Mật khẩu cũ" 
                                  value={oldPassword} 
                                  onChange={e => setOldPassword(e.target.value)} 
                                />
                              </div>
                              <div className="col-md-6">
                                <input 
                                  type="password" 
                                  className="form-control" 
                                  placeholder="Mật khẩu mới" 
                                  value={newPassword} 
                                  onChange={e => setNewPassword(e.target.value)} 
                                />
                              </div>
                              <div className="col-md-6">
                                <input 
                                  type="password" 
                                  className="form-control" 
                                  placeholder="Xác nhận mật khẩu mới" 
                                  value={confirmPassword} 
                                  onChange={e => setConfirmPassword(e.target.value)} 
                                />
                              </div>
                              <div className="col-12">
                                <button 
                                  className="btn btn-primary w-100 py-2 fw-bold shadow-sm" 
                                  onClick={handleChangePassword} 
                                  disabled={loading}
                                >
                                  {loading ? <span className="spinner-border spinner-border-sm"></span> : 'Lưu mật khẩu mới'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-4 pt-2 d-flex flex-wrap gap-3">
                          <button onClick={() => setShowEditProfile(true)} className="btn btn-primary-blue px-4 py-2 d-flex align-items-center gap-2 shadow-sm rounded-3">
                            <Edit size={18} /> Chỉnh sửa hồ sơ
                          </button>
                        </div>

                        {/* Settings Dropdown Section */}
                        <div className="settings-section mt-5 pt-3 border-top">
                          <button 
                            onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                            className="btn btn-link text-decoration-none text-dark fw-bold d-flex align-items-center justify-content-between w-100 p-0"
                          >
                            <span className="d-flex align-items-center gap-2">
                              <Settings size={20} className="text-muted" /> Cài đặt & Tùy chỉnh
                            </span>
                            {showSettingsDropdown ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                          </button>

                          {showSettingsDropdown && (
                            <div className="settings-dropdown-content mt-4 animate-fade-in">
                              <div className="settings-card p-4 rounded-4 bg-light border-0">
                                <div className="mb-4">
                                  <label className="form-label fw-bold d-flex align-items-center gap-2 mb-3 text-muted small text-uppercase letter-spacing-1">
                                    <Sun size={18} /> Chế độ giao diện
                                  </label>
                                  <div className="d-flex gap-2">
                                    <button 
                                      className={`btn flex-grow-1 py-2 rounded-3 d-flex align-items-center justify-content-center gap-2 ${theme === 'light' ? 'btn-white shadow-sm fw-bold border' : 'btn-outline-secondary'}`} 
                                      onClick={() => setTheme('light')}
                                    >
                                      <Sun size={16} /> Sáng
                                    </button>
                                    <button 
                                      className={`btn flex-grow-1 py-2 rounded-3 d-flex align-items-center justify-content-center gap-2 ${theme === 'dark' ? 'btn-white shadow-sm fw-bold border' : 'btn-outline-secondary'}`} 
                                      onClick={() => setTheme('dark')}
                                    >
                                      <Moon size={16} /> Tối
                                    </button>
                                  </div>
                                </div>
                                
                                <div className="mb-0">
                                  <label className="form-label fw-bold d-flex align-items-center gap-2 mb-3 text-muted small text-uppercase letter-spacing-1">
                                    <Globe size={18} /> Ngôn ngữ
                                  </label>
                                  <select 
                                    className="form-select border-0 shadow-sm py-2 rounded-3" 
                                    value={language} 
                                    onChange={e => setLanguage(e.target.value)}
                                  >
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