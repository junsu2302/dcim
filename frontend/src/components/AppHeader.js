import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_TABS = [
  { label: '랙 실장도', path: '/' },
  { label: '장비 리스트', path: '/devices' },
  { label: '이력 관리', path: '/snapshots' },
];

function AppHeader({ activePath }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [showUserMenu, setShowUserMenu] = useState(false);
  const initial = user?.username?.[0]?.toUpperCase() || '?';

  return (
    <div
      className="flex justify-between items-stretch px-8 flex-shrink-0"
      style={{ backgroundColor: '#003DA5', height: '52px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* 로고 */}
      <div
        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition flex-shrink-0"
        onClick={() => navigate('/')}
      >
        <img src={require('../assets/header_logo.png')} alt="IBK시스템" style={{ height: '28px' }} />
        <div className="w-px h-4 bg-white opacity-20" />
        <span className="text-xs font-semibold tracking-wider" style={{ color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em' }}>
          IT 인프라 관리 시스템
        </span>
      </div>

      {/* 오른쪽 */}
      <div className="flex items-stretch">
        {/* 탭 */}
        {NAV_TABS.map((tab) => {
          const isActive = tab.path === activePath;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="px-5 text-xs font-medium transition-all flex items-center"
              style={{
                color: isActive ? 'white' : 'rgba(255,255,255,0.48)',
                borderBottom: isActive ? '2px solid white' : '2px solid transparent',
                letterSpacing: '0.01em',
              }}
            >
              {tab.label}
            </button>
          );
        })}

        {/* 구분선 */}
        <div className="flex items-center mx-3">
          <div className="w-px h-4 bg-white opacity-20" />
        </div>

        {/* 유저 메뉴 */}
        <div className="relative flex items-center">
          <button
            onClick={() => setShowUserMenu((prev) => !prev)}
            className="flex items-center gap-2 px-3 h-full text-xs transition"
            style={{
              color: 'rgba(255,255,255,0.85)',
              backgroundColor: showUserMenu ? 'rgba(255,255,255,0.08)' : 'transparent',
            }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: isAdmin ? '#FFB81C' : 'rgba(255,255,255,0.22)', color: 'white' }}
            >
              {initial}
            </div>
            <span className="font-medium">{user?.username}</span>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ opacity: 0.45, flexShrink: 0 }}>
              <path d="M1 1l4 4 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div
                className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-100 overflow-hidden z-50"
                style={{
                  minWidth: '150px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
                  animation: 'slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
              <div className="px-4 py-3 border-b border-gray-50">
                <div className="text-xs font-semibold text-gray-700">{user?.username}</div>
                <div className="text-xs text-gray-400 mt-0.5">{isAdmin ? '관리자' : '뷰어'}</div>
              </div>
              {isAdmin && (
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/users'); }}
                  className="w-full px-4 py-2.5 text-left text-xs font-medium text-gray-600 hover:bg-gray-50 transition flex items-center gap-2"
                >
                  사용자 관리
                </button>
              )}
              <button
                onClick={() => { setShowUserMenu(false); logout(); navigate('/login'); }}
                className="w-full px-4 py-2.5 text-left text-xs font-medium hover:bg-gray-50 transition flex items-center gap-2"
                style={{ color: '#C62828' }}
              >
                로그아웃
              </button>
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AppHeader;
