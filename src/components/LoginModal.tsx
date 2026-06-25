import React from 'react';
import { X, LogIn, Lock } from 'lucide-react';

interface LoginModalProps {
  onClose: () => void;
  onLogin: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLogin }) => {
  const handleRealLogin = () => {
    onLogin();
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content glass login-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', padding: '2.5rem 2rem' }}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div className="modal-header" style={{ marginBottom: '1.25rem', justifyContent: 'center', border: 'none', padding: 0 }}>
          <Lock size={26} color="var(--accent-color)" />
          <h2 style={{ fontSize: '1.6rem' }}>구글 계정 연동</h2>
        </div>

        <p className="login-subtitle" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6', textAlign: 'center' }}>
          구글 계정으로 로그인하여 최근 검색 기록(관심종목)과 현재 포트폴리오 구성을 클라우드에 안전하게 동기화하세요.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button
            onClick={handleRealLogin}
            className="analysis-trigger-btn"
            style={{
              height: '46px',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #4285F4, #357ae8)',
              boxShadow: '0 4px 12px rgba(66, 133, 244, 0.3)',
              cursor: 'pointer',
              fontSize: '0.95rem'
            }}
          >
            <LogIn size={18} />
            <span style={{ marginLeft: '8px' }}>Google 계정으로 로그인</span>
          </button>
        </div>
      </div>
    </div>
  );
};
