import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { validateFullName, validateEmail } from '../utils/validation';

const EditProfileModal = ({ show, onClose, user, onUpdate }) => {
  const toast = useToast();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Reset form when user changes
  useEffect(() => {
    setFullName(user?.fullName || '');
    setEmail(user?.email || '');
    setValidationErrors({});
    setError('');
  }, [user]);

  // Real-time validation
  useEffect(() => {
    const errors = {};
    
    if (fullName && fullName.trim() !== '') {
      const nameValidation = validateFullName(fullName);
      if (!nameValidation.isValid()) {
        errors.fullName = nameValidation.getFirstError();
      }
    }
    
    if (email && email.trim() !== '') {
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid()) {
        errors.email = emailValidation.getFirstError();
      }
    }
    
    setValidationErrors(errors);
  }, [fullName, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate fields if they have values
    const errors = {};
    if (fullName && fullName.trim() !== '') {
      const nameValidation = validateFullName(fullName);
      if (!nameValidation.isValid()) {
        errors.fullName = nameValidation.getFirstError();
      }
    }
    
    if (email && email.trim() !== '') {
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid()) {
        errors.email = emailValidation.getFirstError();
      }
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const firstError = Object.values(errors)[0];
      setError(firstError);
      toast.showToast('error', 'Lỗi validation', firstError);
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const payload = {};
      const trimmedFullName = fullName?.trim();
      const trimmedEmail = email?.trim().toLowerCase();
      
      if (trimmedFullName !== user.fullName) {
        payload.fullName = trimmedFullName || null;
      }
      if (trimmedEmail !== user.email) {
        payload.email = trimmedEmail || null;
      }
      
      if (Object.keys(payload).length === 0) {
        onClose();
        return;
      }
      
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${user.userId}`, payload);
      if (res.data) {
        const updatedUser = { ...user, ...res.data };
        onUpdate(updatedUser);
        toast.showToast('success', 'Cập nhật thông tin', 'Hồ sơ đã được cập nhật thành công');
        onClose();
      }
    } catch (err) {
      // Xử lý lỗi duplicate email (status 400)
      let errorMsg = 'Cập nhật thất bại';
      if (err.response?.status === 400) {
        errorMsg = 'Email đã tồn tại. Vui lòng sử dụng email khác.';
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.data) {
        errorMsg = err.response.data;
      }
      setError(errorMsg);
      toast.showToast('error', 'Cập nhật thất bại', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4">
          <div className="modal-header border-0 pb-0">
            <h5 className="fw-bold">Chỉnh sửa thông tin cá nhân</h5>
            <button onClick={onClose} className="btn-close"></button>
          </div>
          <form onSubmit={handleSubmit} className="modal-body p-4">
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="mb-3">
              <label className="form-label small fw-bold text-muted text-uppercase">Họ và tên</label>
              <input
                type="text"
                className={`form-control ${validationErrors.fullName ? 'is-invalid' : ''}`}
                placeholder="Nhập họ và tên (tùy chọn)"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                maxLength="100"
              />
              {validationErrors.fullName && (
                <div className="invalid-feedback d-block small">{validationErrors.fullName}</div>
              )}
              <div className="form-text small text-muted">Tối đa 100 ký tự, chỉ chữ cái và khoảng trắng</div>
            </div>
            <div className="mb-4">
              <label className="form-label small fw-bold text-muted text-uppercase">Email</label>
              <input
                type="email"
                className={`form-control ${validationErrors.email ? 'is-invalid' : ''}`}
                placeholder="email@example.com (tùy chọn)"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              {validationErrors.email && (
                <div className="invalid-feedback d-block small">{validationErrors.email}</div>
              )}
              <div className="form-text small text-muted">Email phải đúng định dạng và chưa được sử dụng</div>
            </div>
            <div className="d-flex gap-2">
              <button 
                type="button" 
                className="btn btn-outline-secondary flex-fill" 
                onClick={onClose}
                disabled={loading}
              >
                Hủy
              </button>
              <button 
                type="submit" 
                className="btn btn-primary flex-fill d-flex align-items-center justify-content-center gap-2" 
                disabled={loading || Object.keys(validationErrors).length > 0}
              >
                {loading ? <span className="spinner-border spinner-border-sm"></span> : <><Save size={16} /> Lưu thay đổi</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
            <div className="mb-3">
              <label className="form-label small fw-bold">Họ và tên</label>
              <input type="text" className="form-control" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nhập họ tên" />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-bold">Email</label>
              <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} placeholder="Nhập email" />
            </div>
            <button type="submit" className="btn btn-primary w-100 py-2 fw-bold" disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm"></span> : <> Lưu thay đổi</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;