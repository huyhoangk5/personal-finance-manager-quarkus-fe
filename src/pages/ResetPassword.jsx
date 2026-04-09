import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../context/ToastContext';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.showToast('error', 'Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('${import.meta.env.VITE_API_URL}/api/users/reset-password', { token, newPassword });
      setMessage(res.data);
      toast.showToast('success', 'Thành công', res.data);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const msg = err.response?.data || 'Có lỗi xảy ra';
      setMessage(msg);
      toast.showToast('error', 'Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <div className="text-center mt-5">Token không hợp lệ</div>;
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="card-body p-5">
                <h3 className="text-center fw-bold mb-4">Đặt lại mật khẩu</h3>
                {message && <div className="alert alert-info">{message}</div>}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Mật khẩu mới</label>
                    <input
                      type="password"
                      className="form-control"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-semibold">Xác nhận mật khẩu</label>
                    <input
                      type="password"
                      className="form-control"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
                    {loading ? <span className="spinner-border spinner-border-sm"></span> : 'Đặt lại mật khẩu'}
                  </button>
                </form>
                <div className="text-center mt-4">
                  <Link to="/login" className="text-decoration-none">Quay lại đăng nhập</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;