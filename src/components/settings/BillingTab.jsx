import React, { useState, useEffect } from 'react';
import ConfirmModal from '../ui/ConfirmModal';
import PaymentModal from '../ui/PaymentModal';
import { useToast } from '../../context/ToastContext';
import { profileService } from '../../services/api';

const BillingTab = ({ isActive }) => {
    const [modalState, setModalState] = useState({ isOpen: false, type: '', title: '', desc: '', confirmText: '', cancelText: '' });
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState([
        { id: 'default1', type: 'card', text: 'Visa **** 1234', isDefault: true }
    ]);
    const { showToast } = useToast();
    const [vipStatus, setVipStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadVipStatus = async () => {
        try {
            setLoading(true);
            const data = await profileService.getVipStatus();
            setVipStatus(data);
        } catch (error) {
            console.error('Lỗi lấy thông tin VIP:', error);
            showToast('Không thể lấy thông tin gói cước');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isActive) {
            loadVipStatus();
        }
    }, [isActive]);

    const openModal = (type, title, desc, confirmText, cancelText) => {
        setModalState({ isOpen: true, type, title, desc, confirmText, cancelText });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, type: '', title: '', desc: '', confirmText: '', cancelText: '' });
    };

    const handleConfirm = async () => {
        if (modalState.type === 'delete_payment') {
            setPaymentMethods(prev => prev.filter(p => p.id !== modalState.targetId));
            showToast('Đã xóa phương thức thanh toán');
        } else if (modalState.type === 'renew_vip' || modalState.type === 'buy_vip') {
            try {
                await profileService.upgradeVip();
                showToast(modalState.type === 'renew_vip' ? 'Gia hạn gói VIP thành công!' : 'Đăng ký gói VIP thành công!');
                loadVipStatus();
            } catch (error) {
                showToast(error.message || 'Lỗi khi thanh toán');
            }
        } else if (modalState.type === 'cancel_vip') {
            showToast('Đã hủy gia hạn tự động gói VIP!');
        }
        closeModal();
    };

    const handlePaymentSuccess = (newMethod) => {
        setPaymentMethods([...paymentMethods, newMethod]);
        showToast(`Thêm phương thức ${newMethod.type === 'momo' ? 'MoMo' : 'thẻ'} thành công!`);
    };

    return (
        <div className={`tab-pane ${isActive ? 'active' : ''}`}>
            <div className="tab-header">
                <h2 className="tab-title">Gói Cước & Thanh Toán</h2>
                <p className="tab-desc">Quản lý gói đăng ký hiện tại, thẻ và lịch sử giao dịch.</p>
            </div>

            <div className="VIP-card">
                {loading ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải thông tin gói cước...</div>
                ) : vipStatus?.isVip ? (
                    <>
                        <div className="VIP-header-custom" style={{ marginBottom: '20px' }}>
                            <p className="VIP-subtitle" style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Gói hiện tại của bạn</p>
                            <div className="VIP-title-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '5px' }}>
                                <img src="/images/logo_VIP.png" alt="VIP Logo" style={{ height: '40px', objectFit: 'contain' }} />
                                <span style={{ 
                                    fontSize: '36px', 
                                    fontWeight: 800, 
                                    background: 'linear-gradient(135deg, #FFD700 0%, #FDB931 50%, #FF8C00 100%)', 
                                    WebkitBackgroundClip: 'text', 
                                    WebkitTextFillColor: 'transparent', 
                                    letterSpacing: '2px', 
                                    lineHeight: 1,
                                    filter: 'drop-shadow(0 2px 8px rgba(253, 185, 49, 0.4))'
                                }}>VIP</span>
                            </div>
                            
                            <div className="payment-method-info" style={{ fontSize: '13px', color: 'var(--text-main)', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '16px' }}>99.000đ / tháng</span>
                                <span>•</span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}><rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                                Thanh toán qua Visa ****1234
                            </div>
                        </div>
                        
                        <div className="plan-details" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                            <div className="plan-box" style={{ background: 'var(--bg-card)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border-color)', padding: '15px', borderRadius: '10px' }}>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>Ngày hết hạn</p>
                                <h5 style={{ fontSize: '16px', color: 'var(--text-main)' }}>
                                    {new Date(vipStatus.ngayHetHan).toLocaleDateString('vi-VN')}
                                </h5>
                            </div>
                            <div className="plan-box" style={{ background: 'var(--bg-card)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border-color)', padding: '15px', borderRadius: '10px' }}>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>Thời hạn còn lại</p>
                                <h5 style={{ fontSize: '16px', color: 'var(--text-main)' }}>{vipStatus.soNgayConLai} ngày</h5>
                            </div>
                            <div className="plan-box" style={{ background: 'var(--bg-card)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border-color)', padding: '15px', borderRadius: '10px' }}>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>Trạng thái</p>
                                <h5 style={{ color: 'var(--accent-green)', fontSize: '16px' }}>Đang hoạt động</h5>
                            </div>
                        </div>
                        
                        <button className="btn-VIP" onClick={() => openModal('renew_vip', 'Gia hạn gói cước', 'Bạn muốn mua thêm 30 ngày VIP với mức giá 99.000đ?', 'Xác nhận thanh toán', 'Hủy')}>Gia hạn 30 ngày (99K)</button>
                    </>
                ) : (
                    <>
                        <div className="VIP-header-custom" style={{ marginBottom: '20px' }}>
                            <p className="VIP-subtitle" style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Gói hiện tại của bạn</p>
                            <h2 style={{ fontSize: '28px', color: 'var(--text-main)', marginBottom: '10px' }}>Gói Miễn Phí</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Trải nghiệm điện ảnh không giới hạn với độ phân giải 4K, không quảng cáo và âm thanh vòm đỉnh cao khi nâng cấp lên gói VIP.</p>
                        </div>
                        <button className="btn-VIP" onClick={() => openModal('buy_vip', 'Đăng ký gói VIP', 'Bạn muốn đăng ký gói VIP 30 ngày với mức giá 99.000đ?', 'Xác nhận thanh toán', 'Hủy')}>Nâng cấp VIP (99K/Tháng)</button>
                    </>
                )}
            </div>

            <div className="setting-card">
                <h3>PHƯƠNG THỨC THANH TOÁN</h3>
                <div id="paymentMethodsList">
                    {paymentMethods.map((pm, index) => (
                        <div key={pm.id} className="list-item" style={{ background: 'var(--bg-card)', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid var(--border-color)' }}>
                            <div className="list-item-left">
                                <div className="list-icon" style={{ background: 'transparent', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {pm.type === 'momo' ? (
                                        <img src="/images/momo.png" alt="MoMo" style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '4px' }} onError={(e) => { e.target.src = 'https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png' }} />
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '28px', height: '28px', stroke: 'var(--text-main)' }}>
                                            <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
                                            <line x1="2" y1="10" x2="22" y2="10"></line>
                                        </svg>
                                    )}
                                </div>
                                <div className="list-info">
                                    <h5>{pm.text} {index === 0 && <span style={{ background: 'rgba(4, 120, 87, 0.1)', color: 'var(--accent-green)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', marginLeft: '8px' }}>Mặc định</span>}</h5>
                                </div>
                            </div>
                            <button className="list-action red" onClick={() => {
                                setModalState({ isOpen: true, type: 'delete_payment', title: 'Xóa phương thức', desc: 'Bạn có muốn xóa phương thức thanh toán này không?', confirmText: 'Xóa thẻ', cancelText: 'Quay lại', targetId: pm.id });
                            }}>Xóa</button>
                        </div>
                    ))}
                </div>
                <button className="btn-secondary" style={{ width: '100%', marginTop: '5px' }} onClick={() => setIsPaymentModalOpen(true)}>+ Thêm phương thức thanh toán</button>
            </div>

            <div className="setting-card">
                <h3>LỊCH SỬ GIAO DỊCH</h3>
                <div className="list-item" style={{ background: 'var(--bg-card)', padding: '15px', borderRadius: '8px', marginBottom: '10px', border: '1px solid var(--border-color)' }}>
                    <div className="list-item-left">
                        <div className="list-icon" style={{ width: '36px', height: '36px', background: 'transparent' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px', stroke: 'var(--text-main)' }}>
                                <polygon points="12 2 2 7 22 7"></polygon>
                                <line x1="6" y1="21" x2="6" y2="9"></line><line x1="10" y1="21" x2="10" y2="9"></line><line x1="14" y1="21" x2="14" y2="9"></line><line x1="18" y1="21" x2="18" y2="9"></line><line x1="2" y1="21" x2="22" y2="21"></line>
                            </svg>
                        </div>
                        <div className="list-info"><h5>99,000đ - Gói VIP 1 Tháng</h5><p>15/04/2026 • #INV-2026-04</p></div>
                    </div>
                    <div style={{ textAlign: 'right' }}><span style={{ background: 'rgba(4, 120, 87, 0.1)', color: 'var(--accent-green)', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Thành công</span></div>
                </div>

                <div className="list-item" style={{ background: 'var(--bg-card)', padding: '15px', borderRadius: '8px', marginBottom: '10px', border: '1px solid var(--border-color)' }}>
                    <div className="list-item-left">
                        <div className="list-icon" style={{ width: '36px', height: '36px', background: 'transparent' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px', stroke: 'var(--text-main)' }}>
                                <polygon points="12 2 2 7 22 7"></polygon>
                                <line x1="6" y1="21" x2="6" y2="9"></line><line x1="10" y1="21" x2="10" y2="9"></line><line x1="14" y1="21" x2="14" y2="9"></line><line x1="18" y1="21" x2="18" y2="9"></line><line x1="2" y1="21" x2="22" y2="21"></line>
                            </svg>
                        </div>
                        <div className="list-info"><h5>99,000đ - Gói VIP 1 Tháng</h5><p>15/03/2026 • #INV-2026-03</p></div>
                    </div>
                    <div style={{ textAlign: 'right' }}><span style={{ background: 'rgba(4, 120, 87, 0.1)', color: 'var(--accent-green)', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Thành công</span></div>
                </div>
            </div>

            <ConfirmModal 
                isOpen={modalState.isOpen}
                title={modalState.title}
                description={modalState.desc}
                onConfirm={handleConfirm}
                onCancel={closeModal}
                confirmText={modalState.confirmText}
                cancelText={modalState.cancelText}
                isDanger={modalState.type === 'cancel_vip' || modalState.type === 'delete_payment'}
            />
            <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onSuccess={handlePaymentSuccess} />
        </div>
    );
};

export default BillingTab;
