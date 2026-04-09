import { useState } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('${import.meta.env.VITE_API_URL}/api/users/forgot-password', { email });
      setMessage(res.data);
      toast.showToast('success', 'Thành công', res.data);
    } catch (err) {
      let errorMsg = 'Có lỗi xảy ra';
      if (err.response && err.response.data) {
        if (typeof err.response.data === 'string') {
          errorMsg = err.response.data;
        } else if (err.response.data.message) {
          errorMsg = err.response.data.message;
        }
      }
      setMessage(errorMsg);
      toast.showToast('error', 'Lỗi', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="card-body p-5">
                <h3 className="text-center fw-bold mb-4">Quên mật khẩu</h3>
                <p className="text-muted text-center mb-4">Nhập email của bạn, chúng tôi sẽ gửi link đặt lại mật khẩu.</p>
                {message && <div className="alert alert-info">{message}</div>}
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="form-label fw-semibold">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
                    {loading ? <span className="spinner-border spinner-border-sm"></span> : 'Gửi yêu cầu'}
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

export default ForgotPassword;