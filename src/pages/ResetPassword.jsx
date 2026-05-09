import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { validatePassword, validatePasswordConfirmation } from '../utils/validation';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();
  const toast = useToast();

  // Real-time validation
  useEffect(() => {
    const errors = {};
    
    if (newPassword) {
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid()) {
        errors.newPassword = passwordValidation.getFirstError();
      }
    }
    
    if (confirmPassword) {
      const confirmValidation = validatePasswordConfirmation(newPassword, confirmPassword);
      if (!confirmValidation.isValid()) {
        errors.confirmPassword = confirmValidation.getFirstError();
      }
    }
    
    setValidationErrors(errors);
  }, [newPassword, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const passwordValidation = validatePassword(newPassword);
    const confirmValidation = validatePasswordConfirmation(newPassword, confirmPassword);
    
    const errors = {};
    if (!passwordValidation.isValid()) {
      errors.newPassword = passwordValidation.getFirstError();
    }
    if (!confirmValidation.isValid()) {
      errors.confirmPassword = confirmValidation.getFirstError();
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const firstError = Object.values(errors)[0];
      toast.showToast('error', 'Lỗi', firstError);
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/reset-password`, { 
        token, 
        newPassword 
      });
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
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-dark) 100%)' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card border-0 shadow-lg p-3" style={{ borderRadius: '24px' }}>
              <div className="card-body p-4">
                <h3 className="text-center fw-bold mb-4 text-main">Đặt lại mật khẩu</h3>
                {message && <div className="alert alert-soft-blue border-0 small mb-4">{message}</div>}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted text-uppercase">Mật khẩu mới</label>
                    <input
                      type="password"
                      className={`form-control bg-light ${validationErrors.newPassword ? 'is-invalid' : ''}`}
                      placeholder="6-16 ký tự, có chữ hoa, thường, số, ký tự đặc biệt"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                    />
                    {validationErrors.newPassword && (
                      <div className="invalid-feedback d-block small">{validationErrors.newPassword}</div>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="form-label small fw-bold text-muted text-uppercase">Xác nhận mật khẩu</label>
                    <input
                      type="password"
                      className={`form-control bg-light ${validationErrors.confirmPassword ? 'is-invalid' : ''}`}
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                    />
                    {validationErrors.confirmPassword && (
                      <div className="invalid-feedback d-block small">{validationErrors.confirmPassword}</div>
                    )}
                  </div>
                  <button 
                    type="submit" 
                    className="btn btn-primary w-100 py-2 fw-bold shadow-sm" 
                    disabled={loading || Object.keys(validationErrors).length > 0}
                  >
                    {loading ? <span className="spinner-border spinner-border-sm"></span> : 'Cập nhật mật khẩu'}
                  </button>
                </form>
                <div className="text-center mt-4">
                  <Link to="/login" className="text-primary-blue text-decoration-none small fw-bold">Quay lại đăng nhập</Link>
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