import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // user chứa UserDTO: { userId, username, fullName, email, role }
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');
    if (storedUser && accessToken) {
      setUser(JSON.parse(storedUser));
      // Gắn token vào axios mặc định
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    }
  }, []);

  /**
   * Gọi sau khi login/register thành công.
   * authData = { accessToken, refreshToken, expiresIn, user: UserDTO }
   */
  const login = (authData) => {
    // Hỗ trợ cả 2 format: AuthResponse mới { accessToken, user } và User entity cũ
    if (authData.accessToken) {
      // Format mới từ JWT
      const { accessToken, refreshToken, user: userData } = authData;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } else {
      // Format cũ (fallback) — user entity trực tiếp
      setUser(authData);
      localStorage.setItem('user', JSON.stringify(authData));
    }
  };

  const logout = async () => {
    // Gọi API logout để revoke refresh token
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/users/logout`, { refreshToken });
      } catch (e) {
        // Bỏ qua lỗi logout
      }
    }
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    delete axios.defaults.headers.common['Authorization'];
  };

  /**
   * Làm mới access token bằng refresh token.
   * Trả về true nếu thành công, false nếu thất bại (cần login lại).
   */
  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/refresh-token`, { refreshToken });
      const { accessToken, refreshToken: newRefreshToken, user: userData } = res.data;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
