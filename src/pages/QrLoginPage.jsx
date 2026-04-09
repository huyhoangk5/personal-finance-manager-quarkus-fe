import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const QrLoginPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [status, setStatus] = useState('Đang xác thực...');

  useEffect(() => {
    if (!token) {
      setStatus('Token không hợp lệ');
      return;
    }
    const verify = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/qr-login/verify?token=${token}`);
        if (res.data && res.data.userId) {
          login(res.data);
          toast.showToast('success', 'Đăng nhập thành công', 'Chào mừng bạn đến với Finance Manager. Vui lòng đổi mật khẩu trong phần cài đặt.');
          navigate('/');
        } else {
          setStatus('Xác thực thất bại, vui lòng thử lại');
        }
      } catch (err) {
        setStatus(err.response?.data || 'Xác thực thất bại');
      }
    };
    verify();
  }, [token, login, navigate, toast]);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status"></div>
        <p>{status}</p>
      </div>
    </div>
  );
};

export default QrLoginPage;