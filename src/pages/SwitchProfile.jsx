import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import './SwitchProfile.css';

const AVATARS = [
  'https://static2.vieon.vn/vieplay-image/profile_avatar/2023/03/28/9rdo8k24_asset24x.webp',
  'https://static2.vieon.vn/vieplay-image/profile_avatar/2023/03/28/5k104vv9_asset34x.webp',
  'https://static2.vieon.vn/vieplay-image/profile_avatar/2023/03/28/6qpy3mtk_asset44x.webp',
  'https://static2.vieon.vn/vieplay-image/profile_avatar/2023/03/28/cy48bhoe_asset54x.webp',
  'https://static2.vieon.vn/vieplay-image/profile_avatar/2023/03/28/7634rbqo_asset74x.webp',
  'https://static2.vieon.vn/vieplay-image/profile_avatar/2023/03/28/qd2hhjm8_asset84x.webp',
  'https://static2.vieon.vn/vieplay-image/profile_avatar/2023/03/28/9tn0n6qa_asset94x.webp'
];

const ICONS = {
  plus: "https://cdn-icons-png.flaticon.com/512/992/992651.png",
  lock: "https://cdn-icons-png.flaticon.com/512/3064/3064155.png",
  edit: "https://cdn-icons-png.flaticon.com/512/1159/1159633.png"
};

const SwitchProfile = () => {
  const navigate = useNavigate();
  const { profiles, activeProfileId, switchProfile, addProfile, updateProfile, deleteProfile } = useUser();

  // ─── STATE ─────────────────────────────────────────────────────────────
  const [view, setView] = useState('home'); // home, setup, pin, logged-in, delete-confirm
  const [actionIntent, setActionIntent] = useState(''); // login, edit

  // Setup State
  const [setupMode, setSetupMode] = useState('create');
  const [editingId, setEditingId] = useState(null);
  const [setupName, setSetupName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [isKids, setIsKids] = useState(false);
  const [tempPin, setTempPin] = useState(null);
  const [showAvatarSelection, setShowAvatarSelection] = useState(false);

  // Pin State
  const [pinMode, setPinMode] = useState('set'); // set, verify
  const [profileToVerify, setProfileToVerify] = useState(null);
  const [currentPinArray, setCurrentPinArray] = useState(['', '', '', '']);
  const [pinStep, setPinStep] = useState(1);
  const [firstPin, setFirstPin] = useState('');
  const pinRefs = [useRef(), useRef(), useRef(), useRef()];

  // Delete State
  const [profileToDelete, setProfileToDelete] = useState(null);

  // Inline Errors
  const [nameError, setNameError] = useState('');
  const [pinError, setPinError] = useState('');

  // Toast notification
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  // Track original values to detect changes
  const originalRef = useRef(null);

  // ─── FUNCTIONS ──────────────────────────────────────────────────────────

  const handleProfileClick = (id) => {
    const profile = profiles.find(p => p.id === id);
    if (profile.pin) {
      setActionIntent('login');
      setProfileToVerify(profile);
      openPinModal('verify', profile);
    } else {
      switchProfile(id);
      navigate('/');
    }
  };

  const clickEditProfile = (id, event) => {
    if (event) event.stopPropagation();
    if (id === null) {
      openSetupProfile(null);
      return;
    }
    const profile = profiles.find(p => p.id === id);
    if (profile && profile.pin) {
      setActionIntent('edit');
      setProfileToVerify(profile);
      openPinModal('verify', profile);
    } else {
      openSetupProfile(id);
    }
  };

  const openSetupProfile = (id) => {
    setNameError('');
    setPinError('');
    setShowAvatarSelection(false);
    if (id) {
      setSetupMode('edit');
      setEditingId(id);
      const profile = profiles.find(p => p.id === id);
      setSetupName(profile.name);
      setSelectedAvatar(profile.avatarUrl);
      setIsKids(profile.isKids);
      setTempPin(profile.pin);
      // Lưu lại giá trị ban đầu để so sánh
      originalRef.current = { name: profile.name, avatarUrl: profile.avatarUrl, pin: profile.pin };
    } else {
      setSetupMode('create');
      setEditingId(null);
      setSetupName('');
      setSelectedAvatar(AVATARS[0]);
      setIsKids(false);
      setTempPin(null);
      originalRef.current = null;
    }
    setView('setup');
  };

  // Phát hiện có thay đổi không (với chế độ edit) hoặc tên hợp lệ (với create)
  const hasChanges = setupMode === 'create'
    ? setupName.trim().length > 0
    : setupName.trim().length > 0 && originalRef.current && (
        setupName.trim() !== originalRef.current.name ||
        selectedAvatar !== originalRef.current.avatarUrl ||
        tempPin !== originalRef.current.pin
      );

  const submitSetupProfile = async () => {
    if (!setupName.trim()) {
      setNameError("Vui lòng nhập tên hồ sơ trước khi lưu!");
      return;
    }
    try {
      if (setupMode === 'create') {
        await addProfile({ name: setupName, avatarUrl: selectedAvatar, isKids, pin: tempPin });
        showToast('Đã tạo hồ sơ mới thành công!');
      } else {
        await updateProfile(editingId, { name: setupName, avatarUrl: selectedAvatar, pin: tempPin });
        showToast('Lưu hồ sơ thành công!');
      }
      setView('home');
    } catch (err) {
      setNameError("Có lỗi xảy ra khi lưu hồ sơ.");
    }
  };

  const requestDelete = () => {
    setProfileToDelete(editingId);
    setView('delete-confirm');
  };

  const confirmDeleteProfile = async () => {
    if (profileToDelete) {
      try {
        await deleteProfile(profileToDelete);
        setProfileToDelete(null);
        showToast('Đã xóa hồ sơ thành công!', 'success');
        setView('home');
      } catch (err) {
        setToast({ msg: "Không thể xóa hồ sơ", type: 'error' });
      }
    }
  };

  const handlePinAction = () => {
    if (tempPin) {
      setTempPin(null);
    } else {
      openPinModal('set');
    }
  };

  const openPinModal = (mode, verifyProf = null) => {
    setPinMode(mode);
    setPinStep(1);
    setFirstPin('');
    setCurrentPinArray(['', '', '', '']);
    if (verifyProf) setProfileToVerify(verifyProf);
    setView('pin');
    setTimeout(() => pinRefs[0].current?.focus(), 100);
  };

  const closePinView = () => {
    if (pinMode === 'set') {
      setView('setup');
    } else {
      setView('home');
    }
  };

  const handlePinChange = (val, index) => {
    const newVal = val.replace(/[^0-9]/g, '');
    const newArray = [...currentPinArray];
    newArray[index] = newVal;
    setCurrentPinArray(newArray);

    if (newVal) {
      if (index < 3) {
        pinRefs[index + 1].current?.focus();
      } else {
        handlePinSubmit(newArray);
      }
    }
  };

  const handlePinKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !currentPinArray[index] && index > 0) {
      pinRefs[index - 1].current?.focus();
    }
  };

  const handlePinSubmit = (pinArr) => {
    const fullPin = pinArr.join('');
    if (fullPin.length !== 4) return;

    if (pinMode === 'set') {
      if (pinStep === 1) {
        setFirstPin(fullPin);
        setPinStep(2);
        setCurrentPinArray(['', '', '', '']);
        pinRefs[0].current?.focus();
      } else {
        if (fullPin === firstPin) {
          setTempPin(fullPin);
          setView('setup');
        } else {
          setPinError("Mã PIN không khớp. Vui lòng đặt lại từ đầu.");
          setPinStep(1);
          setFirstPin('');
          setCurrentPinArray(['', '', '', '']);
          pinRefs[0].current?.focus();
        }
      }
    } else {
      if (fullPin === profileToVerify?.pin) {
        if (actionIntent === 'login') {
          switchProfile(profileToVerify.id);
          navigate('/');
        } else if (actionIntent === 'edit') {
          openSetupProfile(profileToVerify.id);
        }
      } else {
        setPinError("Mã PIN không chính xác. Vui lòng thử lại.");
        setCurrentPinArray(['', '', '', '']);
        pinRefs[0].current?.focus();
      }
    }
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────
  return (
    <div className="switch-profile-container">
      {/* Toast Thông báo thành công */}
      {toast && (
        <div className="sp-toast" style={{ background: toast.type === 'success' ? '#0284c7' : '#ef4444' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          <span>{toast.msg}</span>
        </div>
      )}
      {/* Nút Về Trang chủ chung cho mọi view, ngoại trừ alert */}
      <Link to="/" className="back-link-top" title="Về trang chủ Nighthub">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Trang chủ
      </Link>

      {view === 'home' && (
        <div className="main-view-container animate-fade-in">
          <div className="logo-container">
            <Link to="/" className="logo-wrapper">
              <img src="/images/logo.png" alt="Nighthub Logo" className="logo-img" onError={(e) => { e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg'; e.target.style.height = '60px'; e.target.style.margin = '20px 0'; e.target.style.filter = 'brightness(0)'; }} />
            </Link>
          </div>
          <h1 className="page-title">Chọn hồ sơ</h1>
          <p className="page-subtitle">Ai đang xem?</p>

          <div className="profiles-grid">
            {profiles.map(profile => {
              const isActive = activeProfileId === profile.id;
              return (
                <div key={profile.id} className={`profile-card ${isActive ? 'active' : ''}`} onClick={() => handleProfileClick(profile.id)}>
                  <div className="profile-avatar-wrapper">
                    <img src={profile.avatarUrl} className="profile-avatar" alt={profile.name} />
                    {profile.pin && (
                      <div className="badge-lock">
                        <img src={ICONS.lock} alt="Locked" />
                      </div>
                    )}
                    <div className="btn-edit-profile" onClick={(e) => clickEditProfile(profile.id, e)} title="Chỉnh sửa thông tin">
                      <img src={ICONS.edit} alt="Edit" />
                    </div>
                  </div>
                  <span className="profile-name">{profile.name}</span>
                </div>
              );
            })}

            {profiles.length < 5 && (
              <div className="profile-card add-new" onClick={(e) => clickEditProfile(null, e)}>
                <div className="add-icon-wrapper">
                  <img src={ICONS.plus} className="add-icon" alt="Add" />
                </div>
                <span className="profile-name" style={{ opacity: 0.8 }}>Thêm hồ sơ</span>
              </div>
            )}
          </div>

          <p className="profile-count" style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 500, marginTop: 16 }}>
            Đã sử dụng {profiles.length}/5 hồ sơ
          </p>
        </div>
      )}

      {/* SETUP VIEW */}
      {view === 'setup' && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-box modal-md">
            <div className="modal-header">
              <h2>{setupMode === 'create' ? 'Tạo hồ sơ mới' : 'Chỉnh sửa hồ sơ'}</h2>
              <button onClick={() => setView('home')} className="btn-icon"><img src="https://cdn-icons-png.flaticon.com/512/2961/2961937.png" alt="Đóng" /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ position: 'relative', width: '84px', height: '84px', flexShrink: 0 }}>
                  <img src={selectedAvatar} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }} alt="Avatar" />
                  <div className="avatar-edit-btn" onClick={() => setShowAvatarSelection(!showAvatarSelection)} title="Đổi ảnh đại diện">
                    <img src={ICONS.edit} alt="Edit Avatar" />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ marginBottom: '8px' }}>Tên hồ sơ</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ borderColor: nameError ? 'var(--accent-red)' : undefined }}
                    placeholder="Nhập tên của bạn" 
                    value={setupName} 
                    onChange={e => { setSetupName(e.target.value); setNameError(''); }} 
                  />
                  {nameError && <div style={{ color: 'var(--accent-red)', fontSize: '13px', marginTop: '6px', fontWeight: 500 }}>{nameError}</div>}
                </div>
              </div>

              {showAvatarSelection && (
                <div className="form-group animate-fade-in">
                  <label className="form-label">Chọn ảnh đại diện</label>
                  <div className="avatar-picker-grid">
                    {AVATARS.map(url => (
                      <button key={url} className={`avatar-option ${selectedAvatar === url ? 'active' : ''}`} onClick={() => { setSelectedAvatar(url); setShowAvatarSelection(false); }}>
                        <img src={url} alt="Avatar Option" />
                      </button>
                    ))}
                  </div>
                </div>
              )}



              <div className="toggle-box" style={{ marginBottom: '16px' }}>
                <div className="toggle-info">
                  <div className="toggle-icon"><img src={ICONS.lock} alt="Khóa" /></div>
                  <div className="toggle-text">
                    <h4>Chế độ trẻ em</h4>
                    <p>Tự động hạn chế phim có nội dung không phù hợp với trẻ em</p>
                    {setupMode === 'edit' && <div style={{ fontSize: '12px', color: 'var(--accent-red)', marginTop: '6px', fontWeight: 500 }}>(Không thể thay đổi loại hồ sơ sau khi tạo)</div>}
                  </div>
                </div>
                <button 
                  className={`toggle-switch ${isKids ? 'active' : ''} ${setupMode === 'edit' ? 'disabled' : ''}`} 
                  onClick={() => {
                    if (setupMode !== 'edit') {
                      setIsKids(!isKids);
                      if (!isKids) setTempPin(null);
                    }
                  }}
                  style={{ pointerEvents: setupMode === 'edit' ? 'none' : 'auto' }}
                >
                  <div className="toggle-circle"></div>
                </button>
              </div>

              {(!isKids || (setupMode === 'edit' && editingId !== 1)) && (
                <div className="setting-list">
                  {!isKids && (
                    <>
                      <div className="setting-row-item">
                        <div className="setting-info">
                          <h4>{tempPin ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>Mã PIN <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2"><path d="M20 6L9 17l-5-5"></path></svg></span> : 'Mã PIN'}</h4>
                          <p>Khi đặt mã PIN, người dùng sẽ được khóa bằng mã PIN 4 số</p>
                        </div>
                        <button type="button" className="action-text-btn" onClick={handlePinAction}>{tempPin ? 'Xoá mã PIN' : 'Đặt mã PIN'}</button>
                      </div>
                      <div className="setting-row-item">
                        <div className="setting-info"><h4 className={!tempPin ? 'disabled-text' : ''}>Đổi mã PIN</h4></div>
                        <button type="button" className={`action-text-btn ${!tempPin ? 'disabled' : ''}`} onClick={() => openPinModal('set')}>Thay đổi</button>
                      </div>
                    </>
                  )}
                  {setupMode === 'edit' && editingId !== 1 && (
                    <div className="setting-row-item">
                      <div className="setting-info"><h4>Xóa người dùng</h4></div>
                      <button type="button" className="action-text-btn" style={{ color: 'var(--accent-red)' }} onClick={requestDelete}>Xóa</button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                onClick={submitSetupProfile}
                className="btn btn-primary"
                disabled={!hasChanges}
                style={{ width: '100%', fontSize: '18px' }}
              >
                Lưu thiết lập hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN VIEW */}
      {view === 'pin' && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-box modal-sm pin-wrapper">
            <button onClick={closePinView} className="btn-icon" style={{ position: 'absolute', top: 16, right: 16 }}><img src="https://cdn-icons-png.flaticon.com/512/2961/2961937.png" alt="Đóng" /></button>
            <div className="pin-icon-box"><img src={ICONS.lock} alt="Khóa" /></div>
            <h2 className="pin-title">
              {pinMode === 'set' ? (pinStep === 1 ? 'Đặt mã PIN' : 'Xác nhận mã PIN') : 'Nhập mã PIN'}
            </h2>
            <p className="pin-desc" style={{ color: 'var(--text-muted)', marginBottom: pinError ? 16 : 32 }}>
              {pinMode === 'set' 
                ? (pinStep === 1 ? 'Tạo mã PIN 4 số để bảo vệ hồ sơ' : 'Vui lòng nhập lại mã PIN để xác nhận') 
                : `Nhập mã PIN để truy cập hồ sơ của ${profileToVerify?.name}`}
            </p>
            {pinError && <div style={{ color: 'var(--accent-red)', fontSize: '14px', marginBottom: '16px', fontWeight: 500 }}>{pinError}</div>}
            <div className="pin-inputs-container">
              {[0, 1, 2, 3].map(i => (
                <input
                  key={i}
                  ref={pinRefs[i]}
                  type="password"
                  inputMode="numeric"
                  maxLength="1"
                  className="pin-input"
                  value={currentPinArray[i]}
                  onChange={e => handlePinChange(e.target.value, i)}
                  onKeyDown={e => handlePinKeyDown(e, i)}
                />
              ))}
            </div>
            <div className="pin-footer">Ghi nhớ mã PIN của bạn để truy cập</div> 
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {view === 'delete-confirm' && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 9998, display: 'flex', opacity: 1 }}>
          <div className="modal-box" style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: 20, marginBottom: 10, color: 'var(--text-main)' }}>Xóa hồ sơ?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Bạn có chắc chắn muốn xóa hồ sơ này không? Hành động này không thể hoàn tác.</p>
            <div className="modal-buttons">
              <button onClick={() => setView('setup')} className="btn btn-primary">Quay lại</button>
              <button onClick={confirmDeleteProfile} className="btn-danger-outline">Xóa</button>
            </div>
          </div>
        </div>
      )}



    </div>
  );
};

export default SwitchProfile;
