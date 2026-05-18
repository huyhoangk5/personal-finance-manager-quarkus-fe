/**
 * Cấu hình axios interceptor toàn cục:
 * - Tự động gắn Authorization header từ localStorage
 * - Tự động refresh token khi nhận 401
 * - Redirect về /login nếu refresh thất bại
 */
import axios from 'axios';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const setupAxiosInterceptors = (refreshAccessToken, logoutCallback) => {
  // Request interceptor — gắn token vào mọi request
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor — xử lý 401 tự động refresh
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Bỏ qua các endpoint auth (tránh vòng lặp)
      const isAuthEndpoint =
        originalRequest.url?.includes('/api/users/login') ||
        originalRequest.url?.includes('/api/users/register') ||
        originalRequest.url?.includes('/api/users/refresh-token') ||
        originalRequest.url?.includes('/api/users/logout');

      if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
        if (isRefreshing) {
          // Đang refresh — xếp hàng chờ
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axios(originalRequest);
          }).catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const success = await refreshAccessToken();
          if (success) {
            const newToken = localStorage.getItem('accessToken');
            processQueue(null, newToken);
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return axios(originalRequest);
          } else {
            processQueue(new Error('Refresh failed'), null);
            logoutCallback();
            window.location.href = '/login';
            return Promise.reject(error);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          logoutCallback();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};
