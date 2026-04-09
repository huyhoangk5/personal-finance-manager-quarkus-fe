import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((type, title, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, removeToast }) => {
  const getTypeConfig = (type) => {
    const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    switch (type) {
      case 'success':
        return {
          bg: isDark ? '#0a2e1a' : '#d4edda',
          border: isDark ? '#1a5c30' : '#c3e6cb',
          text: isDark ? '#e9ecef' : '#155724',
          icon: '✔️'
        };
      case 'error':
        return {
          bg: isDark ? '#3a1a1a' : '#f8d7da',
          border: isDark ? '#7a2a2a' : '#f5c6cb',
          text: isDark ? '#e9ecef' : '#721c24',
          icon: '❌'
        };
      case 'warning':
        return {
          bg: isDark ? '#3a2a1a' : '#fff3cd',
          border: isDark ? '#7a5a2a' : '#ffeeba',
          text: isDark ? '#e9ecef' : '#856404',
          icon: '⚠️'
        };
      default:
        return {
          bg: isDark ? '#1a2a3a' : '#d1ecf1',
          border: isDark ? '#2a5a7a' : '#bee5eb',
          text: isDark ? '#e9ecef' : '#0c5460',
          icon: 'ℹ️'
        };
    }
  };

  return (
    <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999, maxWidth: '380px' }}>
      {toasts.map(toast => {
        const cfg = getTypeConfig(toast.type);
        return (
          <div
            key={toast.id}
            className="toast show mb-2"
            role="alert"
            style={{
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            <div className="d-flex p-3 gap-3 align-items-start">
              <div style={{ fontSize: '1.2rem' }}>{cfg.icon}</div>
              <div className="flex-grow-1">
                <div className="fw-semibold" style={{ color: cfg.text, fontSize: '0.9rem' }}>{toast.title}</div>
                <div style={{ color: cfg.text, fontSize: '0.8rem', opacity: 0.8 }}>{toast.message}</div>
              </div>
              <button
                type="button"
                className="btn-close"
                style={{ fontSize: '0.7rem' }}
                onClick={() => removeToast(toast.id)}
              ></button>
            </div>
          </div>
        );
      })}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export const useToast = () => useContext(ToastContext);