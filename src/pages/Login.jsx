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
      const res = await axios.post('${import.meta.env.VITE_API_URL}/api/users/login', { username, password });
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
      const res = await axios.post('${import.meta.env.VITE_API_URL}/api/users/google-login', { token: credentialResponse.credential });
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
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-10 col-lg-8">
              <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
                <div className="card-body p-5">
                  <div className="row">
                    {/* Cột bên trái: form đăng nhập */}
                    <div className="col-md-6">
                      <div className="text-center mb-4">
                        <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3"><Wallet size={48} className="text-primary" /></div>
                        <h2 className="fw-bold">Finance Manager</h2>
                        <p className="text-muted">Đăng nhập để quản lý tài chính cá nhân</p>
                      </div>
                      {error && <div className="alert alert-danger alert-dismissible fade show" role="alert">{error}<button type="button" className="btn-close" onClick={() => setError('')}></button></div>}

                      {!showOtpForm ? (
                        <>
                          <form onSubmit={handleSubmit}>
                            <div className="mb-3"><label className="form-label fw-semibold">Tên đăng nhập</label><div className="input-group"><span className="input-group-text bg-light border-end-0"><Mail size={18} /></span><input type="text" className="form-control border-start-0 ps-0" placeholder="Nhập tên đăng nhập" value={username} onChange={e => setUsername(e.target.value)} required /></div></div>
                            <div className="mb-3"><label className="form-label fw-semibold">Mật khẩu</label><div className="input-group"><span className="input-group-text bg-light border-end-0"><Lock size={18} /></span><input type="password" className="form-control border-start-0 ps-0" placeholder="Nhập mật khẩu" value={password} onChange={e => setPassword(e.target.value)} required /></div></div>
                            <div className="mb-3 d-flex justify-content-between align-items-center">
                              <div className="form-check">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  id="rememberMe"
                                  checked={rememberMe}
                                  onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="rememberMe">Ghi nhớ đăng nhập</label>
                              </div>
                              <Link to="/forgot-password" className="text-decoration-none small">Quên mật khẩu?</Link>
                            </div>
                            <button type="submit" className="btn btn-primary w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2" disabled={loading}>{loading ? <span className="spinner-border spinner-border-sm"></span> : <>Đăng nhập <ArrowRight size={18} /></>}</button>
                          </form>

                          <div className="text-center mt-4">
                            <p className="text-muted small mb-3">Hoặc tiếp tục với:</p>
                            <div className="d-grid gap-2">
                              <div className="google-btn-wrapper">
                                <GoogleLogin
                                  onSuccess={handleGoogleSuccess}
                                  onError={handleGoogleError}
                                  theme="outline"
                                  size="large"
                                  text="continue_with"
                                  width="100%"
                                />
                              </div>
                              <button
                                onClick={handleFacebookLogin}
                                className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2 py-2"
                              >
                                <Facebook size={18} /> Đăng nhập bằng Facebook
                              </button>
                              <button
                                onClick={() => setShowOtpForm(true)}
                                className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2 py-2"
                              >
                                <Smartphone size={18} /> Đăng nhập bằng OTP (SMS)
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div>
                          <h6 className="text-center mb-3">Đăng nhập bằng OTP</h6>
                          {otpStep === 'send' ? (
                            <div className="mb-3">
                              <label className="form-label fw-semibold">Số điện thoại</label>
                              <input type="tel" className="form-control" placeholder="Nhập số điện thoại" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                              <button className="btn btn-primary w-100 mt-3" onClick={handleSendOtp}>Gửi mã OTP</button>
                            </div>
                          ) : (
                            <div>
                              <label className="form-label fw-semibold">Mã OTP</label>
                              <input type="text" className="form-control" placeholder="Nhập mã 6 số" value={otp} onChange={e => setOtp(e.target.value)} />
                              <button className="btn btn-primary w-100 mt-3" onClick={handleVerifyOtp}>Xác nhận</button>
                            </div>
                          )}
                          <button className="btn btn-link mt-2" onClick={() => { setShowOtpForm(false); setOtpStep('send'); setPhoneNumber(''); setOtp(''); }}>Quay lại</button>
                        </div>
                      )}
                      <div className="text-center mt-4"><Link to="/register" className="text-decoration-none">Chưa có tài khoản? <span className="fw-bold">Đăng ký ngay</span></Link></div>
                    </div>

                    {/* Cột bên phải: QR code theo email */}
                    <div className="col-md-6 d-flex flex-column align-items-center justify-content-center border-start">
                      <div className="text-center w-100">
                        <h5 className="fw-bold mb-3">Đăng nhập nhanh bằng QR</h5>
                        <div className="mb-3">
                          <div className="input-group">
                            <input
                              type="email"
                              className="form-control"
                              placeholder="Nhập email tài khoản"
                              value={qrEmailInput}
                              onChange={e => setQrEmailInput(e.target.value)}
                            />
                            <button
                              className="btn btn-primary"
                              onClick={handleFetchQr}
                              disabled={qrLoading}
                            >
                              {qrLoading ? <span className="spinner-border spinner-border-sm"></span> : <Search size={18} />}
                              Lấy mã
                            </button>
                          </div>
                          {qrError && <div className="text-danger small mt-1">{qrError}</div>}
                        </div>
                        {qrToken ? (
                          <div className="bg-white p-3 rounded-3 d-inline-block">
                            <QRCodeCanvas value={`${window.location.origin}/qr-confirm?token=${qrToken}`} size={180} />
                          </div>
                        ) : null}
                        <p className="text-muted small mt-3">
                          Sử dụng điện thoại <strong>đã đăng nhập</strong> để quét mã.
                        </p>
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