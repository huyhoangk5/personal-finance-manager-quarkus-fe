import { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';

const QrCodeDisplay = ({ userId }) => {
  const [qrToken, setQrToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQrToken = async () => {
      if (!userId) return;
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/qr-code?userId=${userId}`);
        setQrToken(res.data);
      } catch (err) {
        setError('Không thể lấy mã QR');
      } finally {
        setLoading(false);
      }
    };
    fetchQrToken();
  }, [userId]);

  if (!userId) return null;
  if (loading) return <div className="spinner-border text-primary" role="status"></div>;
  if (error) return <p className="text-danger">{error}</p>;

  const qrValue = `${window.location.origin}/qr-confirm?token=${qrToken}`;
  return <QRCodeCanvas value={qrValue} size={180} />;
};

export default QrCodeDisplay;