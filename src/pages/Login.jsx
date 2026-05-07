import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Wallet, Lock, Mail, ArrowRight, Facebook, Smartphone, Search } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { QRCodeCanvas } from 'qrcode.react';

const Login = () => {
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState('send');
  const [qrToken, setQrToken] = useState('');
  const [qrEmail, setQrEmail] = useState('');
  const [qrEmailInput, setQrEmailInput] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const pollingRef = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Đọc thông tin ghi nhớ từ localStorage
  useEffect(() => {
    const savedUsername = localStorage.getItem('rememberedUsername');
    const savedPassword = localStorage.getItem('rememberedPassword');
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedUsername && savedPassword) {
      setUsername(savedUsername);
      setPassword(savedPassword);
      setRememberMe(true);
    }
    if (savedEmail) {
      setQrEmailInput(savedEmail);
    }
  }, []);

  // Polling kiểm tra trạng thái đăng nhập qua QR
  useEffect(() => {
    if (qrToken) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(async () => {
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/qr-login/status?token=${qrToken}`);
          if (res.data && res.data.userId) {
            login(res.data);
            clearInterval(pollingRef.current);
            toast.showToast('success', 'Đăng nhập thành công', 'Chào mừng bạn đến với Finance Manager');
            navigate('/');
          }
        } catch (err) {
          if (err.response?.status !== 404) {
            console.error("Lỗi polling:", err);
          }
        }
      }, 3000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [qrToken, login, navigate, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/login`, { username, password });
      login(res.data);
      if (rememberMe) {
        localStorage.setItem('rememberedUsername', username);
        localStorage.setItem('rememberedPassword', password);
        localStorage.setItem('rememberedEmail', res.data.email || '');
      } else {
        localStorage.removeItem('rememberedUsername');
        localStorage.removeItem('rememberedPassword');
        localStorage.removeItem('rememberedEmail');
      }
      navigate('/');
    } catch (err) {
      const msg = err.response?.data || 'Đăng nhập thất bại';
      toast.showToast('error', 'Đăng nhập thất bại', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/google-login`, { token: credentialResponse.credential });
      login(res.data);
      if (rememberMe) {
        localStorage.setItem('rememberedUsername', res.data.username);
        localStorage.setItem('rememberedPassword', '');
        localStorage.setItem('rememberedEmail', res.data.email || '');
      }
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

  const handleFetchQr = async () => {
    if (!qrEmailInput) {
      toast.showToast('error', 'Lỗi', 'Vui lòng nhập email');
      return;
    }
    setQrLoading(true);
    setQrError('');
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/qr-code-by-email?email=${encodeURIComponent(qrEmailInput)}`);
      setQrToken(res.data);
      setQrEmail(qrEmailInput);
      toast.showToast('success', 'Thành công', 'Mã QR đã sẵn sàng. Hãy quét bằng điện thoại đã đăng nhập.');
    } catch (err) {
      const msg = err.response?.data || 'Email không tồn tại';
      setQrError(msg);
      toast.showToast('error', 'Lỗi', msg);
    } finally {
      setQrLoading(false);
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
                    {/* Cột bên trái: form đăng nhập */}
                    <div className="col-md-6 p-4 p-md-5">
                      <div className="text-center mb-4 mb-md-5">
                        <div className="bg-soft-blue rounded-circle d-inline-flex p-3 mb-3 text-primary-blue shadow-sm">
                          <Wallet size={42} />
                        </div>
                        <h2 className="fw-bold text-main">Chào mừng trở lại</h2>
                        <p className="text-muted small">Đăng nhập để tiếp tục quản lý tài chính</p>
                      </div>
                      
                      {error && <div className="alert alert-danger border-0 small py-2">{error}</div>}

                      {!showOtpForm ? (
                        <>
                          <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label small fw-bold text-muted text-uppercase">Tên đăng nhập hoặc Email</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-end-0 text-muted"><Mail size={18} /></span>
                                    <input 
                                        type="text" 
                                        className="form-control border-start-0 bg-light" 
                                        placeholder="Username or email" 
                                        value={username} 
                                        onChange={e => setUsername(e.target.value)} 
                                        required 
                                    />
                                </div>
                            </div>
                            <div className="mb-3">
                              <label className="form-label small fw-bold text-muted text-uppercase">Mật khẩu</label>
                              <div className="input-group">
                                <span className="input-group-text bg-light border-end-0 text-muted"><Lock size={18} /></span>
                                <input type="password" className="form-control border-start-0 bg-light" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                              </div>
                            </div>
                            <div className="mb-4 d-flex justify-content-between align-items-center">
                              <div className="form-check">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  id="rememberMe"
                                  checked={rememberMe}
                                  onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <label className="form-check-label small text-muted" htmlFor="rememberMe">Ghi nhớ tôi</label>
                              </div>
                              <Link to="/forgot-password" className="text-primary-blue text-decoration-none small fw-bold">Quên mật khẩu?</Link>
                            </div>
                            <button type="submit" className="btn btn-primary w-100 py-2 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2" disabled={loading}>
                              {loading ? <span className="spinner-border spinner-border-sm"></span> : <>Tiếp tục <ArrowRight size={18} /></>}
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
                                  text="continue_with"
                                  width="100%"
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div>
                          {/* OTP Form simplified for brevity */}
                          <h6 className="text-center mb-3">Đăng nhập bằng OTP</h6>
                          <button className="btn btn-link mt-2" onClick={() => setShowOtpForm(false)}>Quay lại</button>
                        </div>
                      )}
                      <div className="text-center mt-5">
                        <span className="text-muted small">Chưa có tài khoản? </span>
                        <Link to="/register" className="text-primary-blue text-decoration-none small fw-bold">Đăng ký ngay</Link>
                      </div>
                    </div>

                    {/* Cột bên phải: QR code & Welcome */}
                    <div className="col-md-6 d-none d-md-flex flex-column align-items-center justify-content-center bg-light bg-opacity-50 border-start">
                      <div className="text-center p-5">
                        <h4 className="fw-bold mb-3">Đăng nhập nhanh</h4>
                        <p className="text-muted small mb-4">Nhập email để nhận mã QR đăng nhập tức thì</p>
                        
                        <div className="input-group mb-4 shadow-sm rounded-3 overflow-hidden">
                          <input
                            type="email"
                            className="form-control border-0"
                            placeholder="Email tài khoản"
                            value={qrEmailInput}
                            onChange={e => setQrEmailInput(e.target.value)}
                          />
                          <button className="btn btn-primary-blue px-3 border-0" onClick={handleFetchQr} disabled={qrLoading}>
                            {qrLoading ? <span className="spinner-border spinner-border-sm"></span> : <Search size={18} />}
                          </button>
                        </div>

                        {qrToken ? (
                          <div className="bg-white p-3 rounded-4 shadow-sm d-inline-block transition-all hover-scale">
                            <QRCodeCanvas value={`${window.location.origin}/qr-confirm?token=${qrToken}`} size={200} />
                          </div>
                        ) : (
                          <div className="bg-white p-5 rounded-4 border border-dashed text-muted d-flex flex-column align-items-center">
                            <Smartphone size={48} className="mb-2 opacity-20" />
                            <span className="small">Mã QR sẽ hiện ở đây</span>
                          </div>
                        )}
                        
                        <div className="mt-4">
                           <p className="text-muted small">Quét mã bằng điện thoại của bạn</p>
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

export default Login;