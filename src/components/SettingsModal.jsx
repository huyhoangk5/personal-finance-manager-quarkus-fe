import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

const SettingsModal = ({ show, onClose }) => {
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'vi');

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const languages = [
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'ja', name: '日本語' }
  ];

  if (!show) return null;

  return (
    <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4">
          <div className="modal-header border-0 pb-0">
            <h5 className="fw-bold">Cài đặt</h5>
            <button onClick={onClose} className="btn-close"></button>
          </div>
          <div className="modal-body p-4">
            <div className="mb-2">
              <label className="form-label fw-bold d-flex align-items-center gap-2"><Globe size={18} /> Ngôn ngữ</label>
              <select className="form-select" value={language} onChange={e => setLanguage(e.target.value)}>
                {languages.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
              </select>
              <small className="text-muted">(Chức năng đa ngôn ngữ đang phát triển)</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
