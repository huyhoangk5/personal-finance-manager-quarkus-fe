import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const QrConfirm = () => {
  const [searchParams] = useSearchParams();
  const qrToken = searchParams.get('token');
  const { user, login } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState('Đang xác nhận...');

  useEffect(() => {
    if (!qrToken) {
      setStatus('Mã QR không hợp lệ.');
      return;
    }
    if (!user) {
      setStatus('Vui lòng đăng nhập vào tài khoản của bạn trên thiết bị này trước khi xác nhận.');
      return;
    }
    const confirm = async () => {
      try {
        await axios.post('${import.meta.env.VITE_API_URL}/api/users/qr-login/confirm', {
          qrToken,
          userId: user.userId
        });
        setStatus('Xác nhận thành công! Máy tính sẽ tự động đăng nhập.');
        toast.showToast('success', 'Thành công', 'Bạn đã xác nhận đăng nhập từ máy tính.');
        setTimeout(() => window.close(), 2000);
      } catch (err) {
        setStatus('Xác nhận thất bại: ' + (err.response?.data || 'Lỗi kết nối'));
        toast.showToast('error', 'Lỗi', err.response?.data);
      }
    };
    confirm();
  }, [qrToken, user, toast]);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status"></div>
        <p>{status}</p>
      </div>
    </div>
  );
};

export default QrConfirm;