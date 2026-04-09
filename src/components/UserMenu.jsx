import { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, Edit } from 'lucide-react';
import EditProfileModal from './EditProfileModal';
import SettingsModal from './SettingsModal';

const UserMenu = ({ user, onLogout, onUpdateUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const menuRef = useRef(null);

  const displayName = user?.fullName && user.fullName.trim() !== '' ? user.fullName : user?.username;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEditProfile = () => {
    setIsOpen(false);
    setShowEditProfile(true);
  };

  const handleSettings = () => {
    setIsOpen(false);
    setShowSettings(true);
  };

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  const handleProfileUpdated = (updatedUser) => {
    onUpdateUser(updatedUser);
  };

  return (
    <>
      <div className="position-relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="btn btn-light rounded-pill d-flex align-items-center gap-2"
          style={{ border: '1px solid #dee2e6' }}
        >
          <User size={18} />
          <span className="fw-semibold">{displayName}</span>
        </button>

        {isOpen && (
          <div className="position-absolute end-0 mt-2 bg-white border rounded-3 shadow-sm" style={{ minWidth: '200px', zIndex: 1050 }}>
            <div className="py-2">
              <button
                onClick={handleEditProfile}
                className="dropdown-item d-flex align-items-center gap-2 px-3 py-2"
                style={{ cursor: 'pointer' }}
              >
                <Edit size={16} /> Chỉnh sửa thông tin
              </button>
              <button
                onClick={handleSettings}
                className="dropdown-item d-flex align-items-center gap-2 px-3 py-2"
                style={{ cursor: 'pointer' }}
              >
                <Settings size={16} /> Cài đặt
              </button>
              <hr className="my-1" />
              <button
                onClick={handleLogout}
                className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 text-danger"
                style={{ cursor: 'pointer' }}
              >
                <LogOut size={16} /> Đăng xuất
              </button>
            </div>
          </div>
        )}
      </div>

      <EditProfileModal
        show={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        user={user}
        onUpdate={handleProfileUpdated}
      />
      <SettingsModal
        show={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
};

export default UserMenu;