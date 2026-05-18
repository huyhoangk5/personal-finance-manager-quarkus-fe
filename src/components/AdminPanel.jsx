import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, BarChart3, FileText, AlertTriangle, Lock, Unlock, Key, Shield, ShieldOff, Search, RefreshCw, CheckCircle, XCircle, Activity, TrendingUp, Eye } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

const AdminPanel = () => {
  const [subTab, setSubTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [resetResult, setResetResult] = useState(null);

  useEffect(() => {
    if (subTab === 'users') fetchUsers();
    else if (subTab === 'stats') fetchStats();
    else if (subTab === 'audit') fetchAuditLogs();
    else if (subTab === 'alerts') fetchAlerts();
  }, [subTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/users`);
      setUsers(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/statistics`);
      setStats(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/audit-logs?limit=50`);
      setAuditLogs(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/alerts`);
      setAlerts(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const toggleLock = async (userId) => {
    try {
      await axios.put(`${API}/api/admin/users/${userId}/lock`);
      fetchUsers();
    } catch (e) { alert(e.response?.data || 'Lỗi'); }
  };

  const changeRole = async (userId, role) => {
    try {
      await axios.put(`${API}/api/admin/users/${userId}/role`, { role });
      fetchUsers();
    } catch (e) { alert(e.response?.data || 'Lỗi'); }
  };

  const resetPassword = async (userId) => {
    try {
      const res = await axios.put(`${API}/api/admin/users/${userId}/reset-password`, {});
      setResetResult({ userId, password: res.data.newPassword });
      setTimeout(() => setResetResult(null), 15000);
    } catch (e) { alert(e.response?.data || 'Lỗi'); }
  };

  const markSafe = async (logId) => {
    try {
      await axios.put(`${API}/api/admin/alerts/${logId}/safe`);
      fetchAlerts();
    } catch (e) { alert(e.response?.data || 'Lỗi'); }
  };

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { key: 'users', icon: <Users size={16} />, label: 'Người dùng' },
    { key: 'stats', icon: <BarChart3 size={16} />, label: 'Thống kê' },
    { key: 'audit', icon: <FileText size={16} />, label: 'Audit Log' },
    { key: 'alerts', icon: <AlertTriangle size={16} />, label: 'Cảnh báo' },
  ];

  return (
    <div className="admin-panel animate-fade-in">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h4 className="fw-bold mb-0 d-flex align-items-center gap-2">
          <Shield size={24} className="text-primary" /> Bảng điều khiển Quản trị
        </h4>
      </div>

      {/* Sub-tabs */}
      <div className="nav-tabs-premium mb-4 d-flex flex-wrap gap-1">
        {tabs.map(t => (
          <button key={t.key}
            className={`nav-link-premium d-flex align-items-center gap-2 ${subTab === t.key ? 'active' : ''}`}
            onClick={() => setSubTab(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* USERS TAB */}
      {subTab === 'users' && (
        <div className="card border-0 shadow-sm p-4 bg-white">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <h5 className="fw-bold mb-0">Quản lý người dùng ({users.length})</h5>
            <div className="d-flex gap-2 align-items-center">
              <div className="input-group" style={{ maxWidth: 280 }}>
                <span className="input-group-text bg-white border-end-0"><Search size={16} /></span>
                <input className="form-control border-start-0" placeholder="Tìm kiếm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <button className="btn btn-light d-flex align-items-center gap-1" onClick={fetchUsers}><RefreshCw size={16} /></button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tài khoản</th>
                    <th>Email</th>
                    <th>Loại xác thực</th>
                    <th>Quyền</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.userId}>
                      <td><span className="badge bg-light text-dark">#{u.userId}</span></td>
                      <td>
                        <div className="fw-bold">{u.username}</div>
                        <small className="text-muted">{u.fullName || '—'}</small>
                      </td>
                      <td><small>{u.email || '—'}</small></td>
                      <td><span className="badge bg-info bg-opacity-10 text-info">{u.authType}</span></td>
                      <td>
                        <select className="form-select form-select-sm" style={{ width: 100 }} value={u.role} onChange={e => changeRole(u.userId, e.target.value)}>
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                      <td>
                        {u.locked
                          ? <span className="badge bg-danger bg-opacity-10 text-danger d-flex align-items-center gap-1" style={{width:'fit-content'}}><XCircle size={12}/>Đã khóa</span>
                          : <span className="badge bg-success bg-opacity-10 text-success d-flex align-items-center gap-1" style={{width:'fit-content'}}><CheckCircle size={12}/>Hoạt động</span>
                        }
                      </td>
                      <td>
                        <div className="d-flex gap-1 flex-wrap">
                          <button className={`btn btn-sm ${u.locked ? 'btn-outline-success' : 'btn-outline-warning'}`} onClick={() => toggleLock(u.userId)} title={u.locked ? 'Mở khóa' : 'Khóa'}>
                            {u.locked ? <Unlock size={14}/> : <Lock size={14}/>}
                          </button>
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => resetPassword(u.userId)} title="Reset mật khẩu">
                            <Key size={14}/>
                          </button>
                        </div>
                        {resetResult?.userId === u.userId && (
                          <div className="mt-1 p-2 bg-warning bg-opacity-10 rounded small">
                            <strong>Mật khẩu mới:</strong> <code>{resetResult.password}</code>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* STATS TAB */}
      {subTab === 'stats' && (
        <div>
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
          ) : stats && (
            <div className="row g-3">
              <div className="col-md-3">
                <div className="card border-0 shadow-sm p-3 text-center bg-white">
                  <Users size={28} className="text-primary mx-auto mb-2"/>
                  <div className="text-muted small fw-bold">TỔNG NGƯỜI DÙNG</div>
                  <h3 className="fw-bold mb-0">{stats.totalUsers || 0}</h3>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card border-0 shadow-sm p-3 text-center bg-white">
                  <Activity size={28} className="text-success mx-auto mb-2"/>
                  <div className="text-muted small fw-bold">TỔNG GIAO DỊCH</div>
                  <h3 className="fw-bold mb-0">{stats.totalTransactions || 0}</h3>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card border-0 shadow-sm p-3 text-center bg-white">
                  <TrendingUp size={28} className="text-danger mx-auto mb-2"/>
                  <div className="text-muted small fw-bold">TỔNG CHI TIÊU</div>
                  <h3 className="fw-bold mb-0">{(stats.totalExpenses || 0).toLocaleString()}</h3>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card border-0 shadow-sm p-3 text-center bg-white">
                  <Shield size={28} className="text-warning mx-auto mb-2"/>
                  <div className="text-muted small fw-bold">TÀI KHOẢN BỊ KHÓA</div>
                  <h3 className="fw-bold mb-0">{stats.lockedUsers || 0}</h3>
                </div>
              </div>

              {stats.topCategories && stats.topCategories.length > 0 && (
                <div className="col-md-6">
                  <div className="card border-0 shadow-sm p-4 bg-white">
                    <h6 className="fw-bold mb-3">Top danh mục được dùng nhiều nhất</h6>
                    {stats.topCategories.map((c, i) => (
                      <div key={i} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <span>{c.name || c.categoryName}</span>
                        <span className="badge bg-primary">{c.count || c.transactionCount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stats.mostActiveUsers && stats.mostActiveUsers.length > 0 && (
                <div className="col-md-6">
                  <div className="card border-0 shadow-sm p-4 bg-white">
                    <h6 className="fw-bold mb-3">Người dùng hoạt động nhiều nhất</h6>
                    {stats.mostActiveUsers.map((u, i) => (
                      <div key={i} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <span>{u.username}</span>
                        <span className="badge bg-success">{u.count || u.transactionCount} giao dịch</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* AUDIT LOG TAB */}
      {subTab === 'audit' && (
        <div className="card border-0 shadow-sm p-4 bg-white">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0">Lịch sử hoạt động</h5>
            <button className="btn btn-light btn-sm d-flex align-items-center gap-1" onClick={fetchAuditLogs}><RefreshCw size={14}/> Làm mới</button>
          </div>
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
          ) : (
            <div className="table-responsive" style={{ maxHeight: 500, overflowY: 'auto' }}>
              <table className="table table-hover align-middle mb-0">
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <th>Thời gian</th>
                    <th>User ID</th>
                    <th>Hành động</th>
                    <th>Chi tiết</th>
                    <th>Nguồn</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log, i) => (
                    <tr key={i}>
                      <td><small>{log.timestamp ? new Date(log.timestamp).toLocaleString('vi-VN') : '—'}</small></td>
                      <td><span className="badge bg-light text-dark">#{log.userId}</span></td>
                      <td><span className="badge bg-primary bg-opacity-10 text-primary">{log.action}</span></td>
                      <td><small className="text-muted">{log.details || '—'}</small></td>
                      <td><small>{log.source || '—'}</small></td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && <tr><td colSpan={5} className="text-center text-muted py-4">Chưa có dữ liệu</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ALERTS TAB */}
      {subTab === 'alerts' && (
        <div className="card border-0 shadow-sm p-4 bg-white">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0 d-flex align-items-center gap-2"><AlertTriangle size={20} className="text-warning"/> Cảnh báo nghi vấn</h5>
            <button className="btn btn-light btn-sm d-flex align-items-center gap-1" onClick={fetchAlerts}><RefreshCw size={14}/> Làm mới</button>
          </div>
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <CheckCircle size={48} className="mb-3 text-success"/>
              <p className="fw-bold">Không có cảnh báo nào</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>User ID</th>
                    <th>Hành động</th>
                    <th>Chi tiết</th>
                    <th>Xử lý</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((a, i) => (
                    <tr key={i}>
                      <td><small>{a.timestamp ? new Date(a.timestamp).toLocaleString('vi-VN') : '—'}</small></td>
                      <td><span className="badge bg-light text-dark">#{a.userId}</span></td>
                      <td><span className="badge bg-warning bg-opacity-10 text-warning">{a.action}</span></td>
                      <td><small>{a.details || '—'}</small></td>
                      <td>
                        <button className="btn btn-sm btn-outline-success d-flex align-items-center gap-1" onClick={() => markSafe(a.logId)}>
                          <CheckCircle size={14}/> An toàn
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
