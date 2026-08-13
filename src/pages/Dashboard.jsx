import { useState, useEffect } from 'react';
import axios from 'axios';
import { Wallet, List, PieChart, Layers, LogOut, User, PlusCircle, Plus, Settings, Edit, ChevronDown, ChevronRight, ChevronLeft, Sun, Moon, Globe, Key, Shield, Eye, EyeOff, Lock } from 'lucide-react';
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
import AiAssistant from '../components/AiAssistant';
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
  const [showTopHeaderDropdown, setShowTopHeaderDropdown] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().toISOString().slice(0, 7));
  const [overviewMonth, setOverviewMonth] = useState(new Date().toISOString().slice(0, 7));
 
  const toast = useToast();
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'vi');
  
  // States for inline editing in Account Tab
  const [isEditingFullName, setIsEditingFullName] = useState(false);
  const [tempFullName, setTempFullName] = useState(user?.fullName || '');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [tempEmail, setTempEmail] = useState(user?.email || '');
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [inlineSaveLoading, setInlineSaveLoading] = useState(false);

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
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/balance-month?month=${overviewMonth}`);
      setBalance(res.data);
    } catch (err) {
      console.error("Lỗi lấy số dư tháng:", err);
    }
  };

  const handleOverviewMonthChange = (delta) => {
    setOverviewMonth(prev => {
      const [year, month] = prev.split('-').map(Number);
      const date = new Date(year, month - 1 + delta, 1);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    });
  };

  const formatOverviewMonth = (ym) => {
    const [year, month] = ym.split('-').map(Number);
    return `Tháng ${month} / ${year}`;
  };

  const isCurrentMonth = overviewMonth === new Date().toISOString().slice(0, 7);

  useEffect(() => {
    fetchBalance();
  }, [user, refreshKey, overviewMonth]);

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
    setTempFullName(updatedUser.fullName || '');
    setTempEmail(updatedUser.email || '');
  };

  const handleInlineSaveProfile = async (field, value) => {
    setInlineSaveLoading(true);
    try {
      const payload = {};
      if (field === 'fullName') {
        const nameVal = validateFullName(value);
        if (!nameVal.isValid()) {
          toast.showToast('error', 'Lỗi', nameVal.getFirstError());
          setInlineSaveLoading(false);
          return;
        }
        payload.fullName = value.trim() || null;
      }
      if (field === 'email') {
        const emailVal = validateEmail(value);
        if (!emailVal.isValid()) {
          toast.showToast('error', 'Lỗi', emailVal.getFirstError());
          setInlineSaveLoading(false);
          return;
        }
        payload.email = value.trim().toLowerCase() || null;
      }

      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${user.userId}`, payload);
      if (res.data) {
        const updatedUser = { ...user, ...res.data };
        handleProfileUpdated(updatedUser);
        toast.showToast('success', 'Thành công', 'Cập nhật thông tin tài khoản thành công');
        if (field === 'fullName') setIsEditingFullName(false);
        if (field === 'email') setIsEditingEmail(false);
      }
    } catch (err) {
      let errorMsg = 'Cập nhật thất bại';
      if (err.response?.status === 400) {
        errorMsg = 'Email đã tồn tại. Vui lòng sử dụng email khác.';
      } else if (err.response?.data) {
        errorMsg = typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data);
      }
      toast.showToast('error', 'Lỗi', errorMsg);
    } finally {
      setInlineSaveLoading(false);
    }
  };

  const handleInlineChangePassword = async () => {
    const passVal = validatePassword(newPassword);
    const confirmVal = validatePasswordConfirmation(newPassword, confirmPassword);
    if (!passVal.isValid()) {
      toast.showToast('error', 'Lỗi', passVal.getFirstError());
      return;
    }
    if (!confirmVal.isValid()) {
      toast.showToast('error', 'Lỗi', confirmVal.getFirstError());
      return;
    }

    setInlineSaveLoading(true);
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/users/change-password`, {
        oldPassword,
        newPassword
      });
      toast.showToast('success', 'Thành công', 'Mật khẩu đã được thay đổi');
      setIsEditingPassword(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.showToast('error', 'Thất bại', err.response?.data || 'Lỗi đổi mật khẩu');
    } finally {
      setInlineSaveLoading(false);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setShowTopHeaderDropdown(false);
    };
    if (showTopHeaderDropdown) {
      window.addEventListener('click', handleOutsideClick);
    }
    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, [showTopHeaderDropdown]);

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
            className={`sidebar-link tab-giao-dich ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            <List />
            <span>Giao dịch</span>
          </button>
          <button
            className={`sidebar-link tab-ngan-sach ${activeTab === 'categoriesBudget' ? 'active' : ''}`}
            onClick={() => setActiveTab('categoriesBudget')}
          >
            <Layers />
            <span>Ngân sách</span>
          </button>
          <button
            className={`sidebar-link tab-thong-ke ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <PieChart />
            <span>Thống kê</span>
          </button>
          <button
            className={`sidebar-link tab-tai-khoan d-md-none ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            <User />
            <span>Tài khoản</span>
          </button>
          {user.role === 'ADMIN' && (
            <button
              className={`sidebar-link admin-tab-mobile-hide ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <Shield />
              <span>Quản lý</span>
            </button>
          )}
        </nav>
      </aside>

      {/* Main Content Section */}
      <main className="main-content-with-sidebar flex-grow-1">
        {/* Global Top Header - Desktop Only */}
        <div className="desktop-top-header d-none d-md-flex justify-content-end align-items-center mb-3">
          <div className="d-flex align-items-center gap-2 position-relative" onClick={(e) => e.stopPropagation()}>
            <span className="fw-bold me-1" style={{ color: 'var(--text-main)', fontSize: '0.92rem' }}>
              {user.fullName || user.username}
            </span>
            <div className="user-avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{width: 38, height: 38}}>
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <button 
              onClick={() => setShowTopHeaderDropdown(prev => !prev)} 
              className={`btn btn-light p-2 border-0 shadow-sm rounded-circle d-flex align-items-center justify-content-center hover-scale ms-1 ${showTopHeaderDropdown ? 'active-settings-btn' : ''}`}
              title="Cài đặt hệ thống"
              style={{width: 38, height: 38}}
            >
              <Settings size={18} />
            </button>

            {showTopHeaderDropdown && (
              <div className="top-header-dropdown shadow-lg rounded-3 position-absolute bg-white py-2 border animate-fade-in" style={{ top: '48px', right: '0px', zIndex: 1050, minWidth: '180px' }}>
                <button 
                  onClick={() => { setActiveTab('account'); setShowTopHeaderDropdown(false); }}
                  className="dropdown-item px-3 py-2 d-flex align-items-center gap-2 text-start w-100 border-0 bg-transparent text-dark"
                >
                  <User size={16} className="text-muted" />
                  <span>Thông tin cá nhân</span>
                </button>
                <button 
                  onClick={() => { setShowSettings(true); setShowTopHeaderDropdown(false); }}
                  className="dropdown-item px-3 py-2 d-flex align-items-center gap-2 text-start w-100 border-0 bg-transparent text-dark"
                >
                  <Settings size={16} className="text-muted" />
                  <span>Cài đặt</span>
                </button>
                <div className="dropdown-divider my-1 border-top"></div>
                <button 
                  onClick={() => { logout(); navigate('/login'); }}
                  className="dropdown-item px-3 py-2 d-flex align-items-center gap-2 text-start text-danger w-100 border-0 bg-transparent"
                >
                  <LogOut size={16} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div key={activeTab} className="animate-fade-in">
          {/* Header Section - Hidden on Account / Admin Tab */}
          {activeTab !== 'account' && activeTab !== 'admin' && (
            <header className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
              <div>
                <h1 className="fw-bold mb-1">Tổng quan tài chính</h1>
                <p className="text-muted mb-0">Chào mừng bạn trở lại, {user.fullName || user.username}!</p>
              </div>
              {/* Month Selector */}
              <div className="d-flex align-items-center gap-2 overview-month-selector">
                <button
                  className="btn btn-sm overview-month-btn"
                  onClick={() => handleOverviewMonthChange(-1)}
                  aria-label="Tháng trước"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="overview-month-label">
                  {formatOverviewMonth(overviewMonth)}
                </span>
                <button
                  className="btn btn-sm overview-month-btn"
                  onClick={() => handleOverviewMonthChange(1)}
                  disabled={isCurrentMonth}
                  aria-label="Tháng sau"
                >
                  <ChevronRight size={16} />
                </button>
                {!isCurrentMonth && (
                  <button
                    className="btn btn-sm overview-month-today-btn"
                    onClick={() => setOverviewMonth(new Date().toISOString().slice(0, 7))}
                    title="Quay về tháng hiện tại"
                  >
                    Hôm nay
                  </button>
                )}
              </div>
            </header>
          )}

          {/* Dashboard Overview Cards */}
          {activeTab !== 'account' && activeTab !== 'admin' && (
            <div className="row g-4 mb-5">
              <div className="col-md-4">
                <div className="card border-0 rounded-4 shadow-sm p-4 h-100 aurora-bg" style={{ borderLeft: '4px solid var(--primary-blue)' }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <small className="text-muted fw-bold letter-spacing-1">SỐ DƯ THÁNG {overviewMonth.split('-')[1]}</small>
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
                    <small className="text-muted fw-bold letter-spacing-1">THU NHẬP THÁNG {overviewMonth.split('-')[1]}</small>
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
                    <small className="text-muted fw-bold letter-spacing-1">CHI TIÊU THÁNG {overviewMonth.split('-')[1]}</small>
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
                <div className="container-fluid py-2 px-0">
                  <div className="row g-0">
                    <div className="col-12">
                      <div className="card border-0 overflow-hidden rounded-4 shadow-sm bg-card">
                        {/* Cover strip */}
                        <div style={{ height: '120px', background: 'linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-light) 100%)' }}></div>
                        <div className="card-body p-4 p-md-5 pt-0">
                          {/* Avatar & Header */}
                          <div className="text-center" style={{ marginTop: '-50px' }}>
                            <div className="d-inline-block p-1 rounded-circle mb-3" style={{ background: 'var(--bg-card)', border: '4px solid var(--border-color)' }}>
                              <div className="bg-soft-blue rounded-circle d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                                <User size={48} color="white" />
                              </div>
                            </div>
                            <h3 className="fw-bold mb-1 text-main">{user.fullName || user.username}</h3>
                            <p className="text-muted mb-4 small">{user.email || 'Thành viên'}</p>
                          </div>
 
                          {/* Detailed Info */}
                          <div className="user-details-grid mt-4">
                            
                            {/* HỌ TÊN */}
                            <div className="detail-item py-4 border-bottom">
                              <div className="row align-items-center">
                                <div className="col-md-3 fw-bold text-main mb-2 mb-md-0">Họ tên</div>
                                <div className="col-md-9">
                                  {!isEditingFullName ? (
                                    <div className="d-flex align-items-center justify-content-between gap-3">
                                      <span className="fw-semibold text-main fs-6">{user.fullName || <em className="text-muted">Chưa cập nhật</em>}</span>
                                      <button 
                                        onClick={() => { setTempFullName(user.fullName || ''); setIsEditingFullName(true); }}
                                        className="btn btn-sm btn-soft-primary d-flex align-items-center gap-1 rounded-3 px-3 py-2"
                                        title="Chỉnh sửa họ tên"
                                      >
                                        <Edit size={14} /> <span>Sửa</span>
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="input-group inline-edit-group shadow-sm rounded-3">
                                      <input 
                                        type="text" 
                                        className="form-control" 
                                        value={tempFullName} 
                                        onChange={e => setTempFullName(e.target.value)}
                                        placeholder="Nhập họ và tên"
                                      />
                                      <button 
                                        onClick={() => handleInlineSaveProfile('fullName', tempFullName)} 
                                        className="btn btn-primary btn-sm px-3 fw-bold" 
                                        disabled={inlineSaveLoading}
                                      >
                                        Lưu
                                      </button>
                                      <button 
                                        onClick={() => setIsEditingFullName(false)} 
                                        className="btn btn-outline-secondary btn-sm px-3"
                                        disabled={inlineSaveLoading}
                                      >
                                        Hủy
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* EMAIL */}
                            <div className="detail-item py-4 border-bottom">
                              <div className="row align-items-center">
                                <div className="col-md-3 fw-bold text-main mb-2 mb-md-0">Email</div>
                                <div className="col-md-9">
                                  {user.authType === 'Google OAuth' ? (
                                    <div className="d-flex align-items-center gap-2 text-muted">
                                      <span className="fw-semibold text-truncate">{user.email}</span>
                                      <Lock size={14} className="opacity-50" />
                                    </div>
                                  ) : (
                                    !isEditingEmail ? (
                                      <div className="d-flex align-items-center justify-content-between gap-3">
                                        <span className="fw-semibold text-main fs-6">{user.email || <em className="text-muted">Chưa cập nhật</em>}</span>
                                        <button 
                                          onClick={() => { setTempEmail(user.email || ''); setIsEditingEmail(true); }}
                                          className="btn btn-sm btn-soft-primary d-flex align-items-center gap-1 rounded-3 px-3 py-2"
                                          title="Chỉnh sửa email"
                                        >
                                          <Edit size={14} /> <span>Sửa</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="input-group inline-edit-group shadow-sm rounded-3">
                                        <input 
                                          type="email" 
                                          className="form-control" 
                                          value={tempEmail} 
                                          onChange={e => setTempEmail(e.target.value)}
                                          placeholder="email@example.com"
                                        />
                                        <button 
                                          onClick={() => handleInlineSaveProfile('email', tempEmail)} 
                                          className="btn btn-primary btn-sm px-3 fw-bold"
                                          disabled={inlineSaveLoading}
                                        >
                                          Lưu
                                        </button>
                                        <button 
                                          onClick={() => setIsEditingEmail(false)} 
                                          className="btn btn-outline-secondary btn-sm px-3"
                                          disabled={inlineSaveLoading}
                                        >
                                          Hủy
                                        </button>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* TÀI KHOẢN (Cảnh báo không được sửa) */}
                            <div className="detail-item py-4 border-bottom">
                               <div className="row align-items-center">
                                 <div className="col-md-3 fw-bold text-main mb-2 mb-md-0">Tài khoản</div>
                                 <div className="col-md-9">
                                   {user.authType === 'Google OAuth' ? (
                                     <span></span>
                                   ) : (
                                     <div className="d-flex align-items-center gap-2 text-muted">
                                       <span className="fw-semibold fs-6">{user.username}</span>
                                       <Lock size={14} className="opacity-50" />
                                     </div>
                                   )}
                                 </div>
                               </div>
                             </div>

                            {/* MẬT KHẨU */}
                            <div className="detail-item py-4 border-bottom">
                              <div className="row align-items-start">
                                <div className="col-md-3 fw-bold text-main mb-2 mb-md-0">Mật khẩu</div>
                                <div className="col-md-9">
                                  {user.authType === 'Google OAuth' ? (
                                    <div className="d-flex align-items-center gap-2 text-muted">
                                      <span className="fw-semibold">••••••••</span>
                                      <Lock size={14} className="opacity-50" />
                                    </div>
                                  ) : (
                                    !isEditingPassword ? (
                                      <div className="d-flex align-items-center justify-content-between gap-3">
                                        <span className="fw-semibold text-muted fs-6">••••••••</span>
                                        <button 
                                          onClick={() => setIsEditingPassword(true)}
                                          className="btn btn-sm btn-soft-primary d-flex align-items-center gap-1 rounded-3 px-3 py-2"
                                          title="Sửa mật khẩu"
                                        >
                                          <Edit size={14} /> <span>Sửa</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="change-password-inline-box p-4 rounded-3 border animate-fade-in bg-light mt-1">
                                        <div className="row g-3">
                                          <div className="col-12">
                                            <label className="form-label small fw-semibold text-muted">Mật khẩu hiện tại</label>
                                            <div className="input-group">
                                              <input type={showOldPassword ? 'text' : 'password'} className="form-control border-end-0" placeholder="Nhập mật khẩu hiện tại" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
                                              <button type="button" className="input-group-text bg-white text-muted" onClick={() => setShowOldPassword(p => !p)} tabIndex={-1}>
                                                {showOldPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                              </button>
                                            </div>
                                          </div>
                                          <div className="col-md-6">
                                            <label className="form-label small fw-semibold text-muted">Mật khẩu mới</label>
                                            <div className="input-group">
                                              <input type={showNewPassword ? 'text' : 'password'} className="form-control border-end-0" placeholder="6-16 ký tự" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                                              <button type="button" className="input-group-text bg-white text-muted" onClick={() => setShowNewPassword(p => !p)} tabIndex={-1}>
                                                {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                              </button>
                                            </div>
                                          </div>
                                          <div className="col-md-6">
                                            <label className="form-label small fw-semibold text-muted">Xác nhận mật khẩu mới</label>
                                            <div className="input-group">
                                              <input type={showConfirmPassword ? 'text' : 'password'} className="form-control border-end-0" placeholder="Nhập lại mật khẩu mới" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                                              <button type="button" className="input-group-text bg-white text-muted" onClick={() => setShowConfirmPassword(p => !p)} tabIndex={-1}>
                                                {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                              </button>
                                            </div>
                                          </div>
                                          <div className="col-12 d-flex gap-2 mt-4">
                                            <button 
                                              className="btn btn-primary px-4 fw-bold" 
                                              onClick={handleInlineChangePassword} 
                                              disabled={inlineSaveLoading}
                                            >
                                              {inlineSaveLoading ? <span className="spinner-border spinner-border-sm"></span> : 'Xác nhận đổi'}
                                            </button>
                                            <button 
                                              className="btn btn-outline-secondary px-4" 
                                              onClick={() => {
                                                setIsEditingPassword(false);
                                                setOldPassword('');
                                                setNewPassword('');
                                                setConfirmPassword('');
                                              }} 
                                              disabled={inlineSaveLoading}
                                            >
                                              Hủy bỏ
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            </div>

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
 
      <SettingsModal
        show={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Mobile Add Transaction FAB */}
      <button 
        className="mobile-fab-add d-md-none d-flex align-items-center justify-content-center shadow-lg"
        onClick={() => { setEditingTransaction(null); setModalOpen(true); }}
        aria-label="Thêm giao dịch"
      >
        <Plus size={28} color="white" />
      </button>

      <AiAssistant onTransactionSaved={handleTransactionSaved} />
    </div>
  );
};

export default Dashboard;
