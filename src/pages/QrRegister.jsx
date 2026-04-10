import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const QrRegister = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailError, setEmailError] = useState('');
    const toast = useToast();
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        if (!token) {
            toast.showToast('error', 'Lỗi', 'Token không hợp lệ');
            navigate('/register');
        }
    }, [token, navigate, toast]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setEmailError('');
        if (password !== confirmPassword) {
            toast.showToast('error', 'Lỗi', 'Mật khẩu xác nhận không khớp');
            return;
        }
        setLoading(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/qr-register`, {
                token,
                email,
                password
            });
            // Đăng nhập tự động với user vừa tạo
            login(res.data);
            toast.showToast('success', 'Đăng ký thành công', 'Chào mừng bạn đến với Finance Manager');
            navigate('/');
        } catch (err) {
            const errorMsg = err.response?.data || 'Đăng ký thất bại';
            if (errorMsg.includes('Email đã tồn tại')) {
                setEmailError('Email đã được sử dụng. Vui lòng chọn email khác.');
            } else {
                toast.showToast('error', 'Lỗi', errorMsg);
            }
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
                                <h3 className="text-center fw-bold mb-4">Hoàn tất đăng ký</h3>
                                <p className="text-muted text-center">Vui lòng nhập email và mật khẩu để hoàn tất tạo tài khoản.</p>
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Email</label>
                                        <input 
                                            type="email" 
                                            className={`form-control ${emailError ? 'is-invalid' : ''}`} 
                                            value={email} 
                                            onChange={e => setEmail(e.target.value)} 
                                            required 
                                        />
                                        {emailError && <div className="invalid-feedback">{emailError}</div>}
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Mật khẩu</label>
                                        <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label fw-semibold">Xác nhận mật khẩu</label>
                                        <input type="password" className="form-control" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                                    </div>
                                    <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
                                        {loading ? 'Đang xử lý...' : 'Hoàn tất'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QrRegister;