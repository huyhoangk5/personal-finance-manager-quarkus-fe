import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Wallet, Lock, Mail, UserPlus, Facebook, Smartphone } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const toast = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState('send');

  // Lấy QR token
  useEffect(() => {
    const fetchQrToken = async () => {
      setQrLoading(true);
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/qr-login/generate`);
        setQrToken(res.data);
      } catch (err) {
        console.error("Lỗi lấy QR token:", err);
      } finally {
        setQrLoading(false);
      }
    };
    fetchQrToken();
  }, []);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/google-login`, { token: credentialResponse.credential });
      login(res.data);
      navigate('/');
    } catch (err) {
      toast.showToast('error', 'Đăng nhập Google thất bại', err.response?.data);
    }
  };

  const handleGoogleError = () => {
    toast.showToast('error', 'Đăng nhập Google thất bại', 'Vui lòng thử lại');
  };

  const handleFacebookLogin = () => {
    toast.showToast('info', 'Tính năng đang phát triển', 'Đăng nhập bằng Facebook sẽ sớm được hỗ trợ.');
  };

  const handleSendOtp = () => {
    toast.showToast('info', 'Tính năng đang phát triển', 'Đăng nhập bằng OTP sẽ sớm được hỗ trợ.');
  };

  const handleVerifyOtp = () => {
    toast.showToast('info', 'Tính năng đang phát triển', 'Đăng nhập bằng OTP sẽ sớm được hỗ trợ.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      toast.showToast('error', 'Đăng ký thất bại', 'Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/register`, { username, password });
      setSuccess(res.data);
      toast.showToast('success', 'Đăng ký thành công', res.data);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const msg = err.response?.data || 'Đăng ký thất bại';
      setError(msg);
      toast.showToast('error', 'Đăng ký thất bại', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId="923508787768-tirtvocpu20jrba6khna61ppbqjv3idj.apps.googleusercontent.com">
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-dark) 100%)' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-10 col-lg-9">
              <div className="card border-0 shadow-lg overflow-hidden" style={{ borderRadius: '24px' }}>
                <div className="card-body p-0">
                  <div className="row g-0">
                    {/* Cột bên trái: form đăng ký */}
                    <div className="col-md-6 p-5">
                      <div className="text-center mb-5">
                        <div className="bg-soft-blue rounded-circle d-inline-flex p-3 mb-3 text-primary-blue shadow-sm">
                          <Wallet size={42} />
                        </div>
                        <h2 className="fw-bold text-main">Tạo tài khoản</h2>
                        <p className="text-muted small">Bắt đầu hành trình quản lý tài chính của bạn</p>
                      </div>

                      {error && <div className="alert alert-danger border-0 small py-2">{error}</div>}
                      {success && <div className="alert alert-success border-0 small py-2">{success}</div>}

                      <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                          <label className="form-label small fw-bold text-muted text-uppercase">Tên đăng nhập</label>
                          <div className="input-group">
                            <span className="input-group-text bg-light border-end-0 text-muted"><Mail size={18} /></span>
                            <input type="text" className="form-control border-start-0 bg-light" placeholder="Nhập tên đăng nhập" value={username} onChange={e => setUsername(e.target.value)} required />
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label small fw-bold text-muted text-uppercase">Mật khẩu</label>
                          <div className="input-group">
                            <span className="input-group-text bg-light border-end-0 text-muted"><Lock size={18} /></span>
                            <input type="password" className="form-control border-start-0 bg-light" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                          </div>
                        </div>
                        <div className="mb-4">
                          <label className="form-label small fw-bold text-muted text-uppercase">Xác nhận mật khẩu</label>
                          <div className="input-group">
                            <span className="input-group-text bg-light border-end-0 text-muted"><Lock size={18} /></span>
                            <input type="password" className="form-control border-start-0 bg-light" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                          </div>
                        </div>
                        <button type="submit" className="btn btn-primary w-100 py-2 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2" disabled={loading}>
                          {loading ? <span className="spinner-border spinner-border-sm"></span> : <>Đăng ký ngay <UserPlus size={18} /></>}
                        </button>
                      </form>

                      <div className="text-center mt-4">
                        <div className="d-flex align-items-center mb-4">
                          <hr className="flex-grow-1" />
                          <span className="px-3 text-muted small">Hoặc</span>
                          <hr className="flex-grow-1" />
                        </div>
                        <div className="d-grid gap-2">
                          <div className="google-btn-wrapper w-100">
                            <GoogleLogin
                              onSuccess={handleGoogleSuccess}
                              onError={handleGoogleError}
                              theme="outline"
                              size="large"
                              text="signup_with"
                              width="100%"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="text-center mt-5">
                        <span className="text-muted small">Đã có tài khoản? </span>
                        <Link to="/login" className="text-primary-blue text-decoration-none small fw-bold">Đăng nhập ngay</Link>
                      </div>
                    </div>

                    {/* Cột bên phải: QR code & Info */}
                    <div className="col-md-6 d-none d-md-flex flex-column align-items-center justify-content-center bg-light bg-opacity-50 border-start">
                      <div className="text-center p-5">
                        <h4 className="fw-bold mb-3">Đăng ký nhanh</h4>
                        <p className="text-muted small mb-4">Quét mã QR để đăng ký tài khoản tức thì</p>
                        
                        {qrLoading ? (
                          <div className="spinner-border text-primary-blue" role="status"></div>
                        ) : qrToken ? (
                          <div className="bg-white p-3 rounded-4 shadow-sm d-inline-block transition-all hover-scale">
                            <QRCodeCanvas value={`${window.location.origin}/qr-register?token=${qrToken}`} size={200} />
                          </div>
                        ) : (
                          <p className="text-muted small">Không thể tạo mã QR</p>
                        )}
                        
                        <div className="mt-5 text-start">
                          <div className="d-flex align-items-center gap-3 mb-3">
                            <div className="p-2 bg-white rounded-circle shadow-sm text-primary-blue"><ArrowRight size={16} /></div>
                            <span className="small text-muted">Quản lý thu chi thông minh</span>
                          </div>
                          <div className="d-flex align-items-center gap-3 mb-3">
                            <div className="p-2 bg-white rounded-circle shadow-sm text-primary-blue"><ArrowRight size={16} /></div>
                            <span className="small text-muted">Báo cáo tài chính chi tiết</span>
                          </div>
                          <div className="d-flex align-items-center gap-3">
                            <div className="p-2 bg-white rounded-circle shadow-sm text-primary-blue"><ArrowRight size={16} /></div>
                            <span className="small text-muted">An toàn và bảo mật tuyệt đối</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Register;