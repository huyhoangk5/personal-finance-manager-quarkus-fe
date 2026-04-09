import { useState, useEffect } from 'react';
import { Sun, Moon, Globe, Key } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const SettingsModal = ({ show, onClose }) => {
  const toast = useToast();
  const { user } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'vi');
  const [showChangePassword, setShowChangePassword] = useState(false);
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
      await axios.put('${import.meta.env.VITE_API_URL}/api/users/change-password', {
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

  const languages = [
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'ja', name: '日本語' }
  ];

  if (!show) return null;

  return (
    <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4">
          <div className="modal-header border-0 pb-0">
            <h5 className="fw-bold">Cài đặt</h5>
            <button onClick={onClose} className="btn-close"></button>
          </div>
          <div className="modal-body p-4">
            <div className="mb-4">
              <label className="form-label fw-bold d-flex align-items-center gap-2"><Sun size={18} /> <Moon size={18} /> Chế độ giao diện</label>
              <div className="d-flex gap-2">
                <button className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setTheme('light')}>Sáng</button>
                <button className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setTheme('dark')}>Tối</button>
              </div>
            </div>
            <div className="mb-4">
              <label className="form-label fw-bold d-flex align-items-center gap-2"><Globe size={18} /> Ngôn ngữ</label>
              <select className="form-select" value={language} onChange={e => setLanguage(e.target.value)}>
                {languages.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
              </select>
              <small className="text-muted">(Chức năng đa ngôn ngữ đang phát triển)</small>
            </div>
            <div className="mb-4">
              <label className="form-label fw-bold d-flex align-items-center gap-2"><Key size={18} /> Bảo mật</label>
              <button className="btn btn-outline-secondary w-100" onClick={() => setShowChangePassword(true)}>Đổi mật khẩu</button>
            </div>
          </div>

          {showChangePassword && (
            <div className="border-top p-4">
              <h6>Đổi mật khẩu</h6>
              <input type="password" className="form-control mb-2" placeholder="Mật khẩu cũ" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
              <input type="password" className="form-control mb-2" placeholder="Mật khẩu mới" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              <input type="password" className="form-control mb-2" placeholder="Xác nhận mật khẩu mới" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              <div className="d-flex gap-2">
                <button className="btn btn-primary" onClick={handleChangePassword} disabled={loading}>Lưu</button>
                <button className="btn btn-secondary" onClick={() => setShowChangePassword(false)}>Hủy</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;