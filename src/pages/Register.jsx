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
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-10 col-lg-8">
              <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
                <div className="card-body p-5">
                  <div className="row">
                    {/* Cột bên trái: form đăng ký */}
                    <div className="col-md-6">
                      <div className="text-center mb-4">
                        <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3"><Wallet size={48} className="text-primary" /></div>
                        <h2 className="fw-bold">Finance Manager</h2>
                        <p className="text-muted">Tạo tài khoản để bắt đầu</p>
                      </div>
                      {error && <div className="alert alert-danger alert-dismissible fade show" role="alert">{error}<button type="button" className="btn-close" onClick={() => setError('')}></button></div>}
                      {success && <div className="alert alert-success alert-dismissible fade show" role="alert">{success}<button type="button" className="btn-close" onClick={() => setSuccess('')}></button></div>}
                      <form onSubmit={handleSubmit}>
                        <div className="mb-3"><label className="form-label fw-semibold">Tên đăng nhập</label><div className="input-group"><span className="input-group-text bg-light border-end-0"><Mail size={18} /></span><input type="text" className="form-control border-start-0 ps-0" placeholder="Nhập tên đăng nhập" value={username} onChange={e => setUsername(e.target.value)} required /></div></div>
                        <div className="mb-3"><label className="form-label fw-semibold">Mật khẩu</label><div className="input-group"><span className="input-group-text bg-light border-end-0"><Lock size={18} /></span><input type="password" className="form-control border-start-0 ps-0" placeholder="Nhập mật khẩu" value={password} onChange={e => setPassword(e.target.value)} required /></div></div>
                        <div className="mb-4"><label className="form-label fw-semibold">Xác nhận mật khẩu</label><div className="input-group"><span className="input-group-text bg-light border-end-0"><Lock size={18} /></span><input type="password" className="form-control border-start-0 ps-0" placeholder="Nhập lại mật khẩu" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required /></div></div>
                        <button type="submit" className="btn btn-primary w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2" disabled={loading}>{loading ? <span className="spinner-border spinner-border-sm"></span> : <>Đăng ký <UserPlus size={18} /></>}</button>
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

                      {/* Form OTP (tạm thời ẩn, chỉ hiện khi bấm nút OTP) */}
                      {showOtpForm && (
                        <div className="mt-3">
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

                      <div className="text-center mt-4"><Link to="/login" className="text-decoration-none">Đã có tài khoản? <span className="fw-bold">Đăng nhập ngay</span></Link></div>
                    </div>

                    {/* Cột bên phải: QR code */}
                    <div className="col-md-6 d-flex flex-column align-items-center justify-content-center border-start">
                      <div className="text-center">
                        <h5 className="fw-bold mb-3">Hoặc quét mã QR để đăng ký nhanh</h5>
                        {qrLoading ? (
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Đang tải...</span>
                          </div>
                        ) : qrToken ? (
                          <div className="bg-white p-3 rounded-3 d-inline-block">
                            <QRCodeCanvas value={`${window.location.origin}/qr-register?token=${qrToken}`} size={180} />
                          </div>
                        ) : (
                          <p className="text-muted">Không thể tạo mã QR, vui lòng thử lại sau.</p>
                        )}
                        <p className="text-muted small mt-3">Sử dụng điện thoại quét mã QR để đăng ký nhanh</p>
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