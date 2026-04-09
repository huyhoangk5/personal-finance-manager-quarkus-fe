import { useState } from 'react';
import axios from 'axios';
import { Save, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const EditProfileModal = ({ show, onClose, user, onUpdate }) => {
  const toast = useToast();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {};
      if (fullName !== user.fullName) payload.fullName = fullName;
      if (email !== user.email) payload.email = email;
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
      const msg = err.response?.data?.message || 'Cập nhật thất bại';
      setError(msg);
      toast.showToast('error', 'Cập nhật thất bại', msg);
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
              <label className="form-label small fw-bold">Tên đầy đủ</label>
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