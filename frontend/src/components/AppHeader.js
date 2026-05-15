import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { changePassword, getLoginHistory } from '../api/auth';

const NAV_TABS = [
  { label: '대시보드', path: '/' },
  { label: '랙 실장도', path: '/rack' },
  { label: '장비 리스트', path: '/devices' },
  { label: '유지보수', path: '/maintenance' },
  { label: '이력 관리', path: '/snapshots' },
];

const inputFocus = (e) => {
  e.target.style.borderColor = '#003DA5';
  e.target.style.boxShadow = '0 0 0 3px rgba(0,61,165,0.12)';
};
const inputBlur = (e) => {
  e.target.style.borderColor = '#E5E7EB';
  e.target.style.boxShadow = 'none';
};

function AppHeader({ activePath }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [showUserMenu, setShowUserMenu] = useState(false);
  const initial = user?.username?.[0]?.toUpperCase() || '?';

  // 비밀번호 변경 모달
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ old: '', new: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  // 로그인 이력 모달
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [loginHistory, setLoginHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    navigate('/login');
  };

  const handleOpenPwModal = () => {
    setShowUserMenu(false);
    setPwForm({ old: '', new: '', confirm: '' });
    setPwError('');
    setPwSuccess(false);
    setShowPwModal(true);
  };

  const handleChangePassword = async () => {
    if (!pwForm.old || !pwForm.new || !pwForm.confirm) {
      return setPwError('모든 항목을 입력해주세요.');
    }
    if (pwForm.new !== pwForm.confirm) {
      return setPwError('새 비밀번호가 일치하지 않습니다.');
    }
    if (pwForm.new.length < 8) {
      return setPwError('새 비밀번호는 8자 이상이어야 합니다.');
    }
    setPwLoading(true);
    setPwError('');
    try {
      await changePassword(pwForm.old, pwForm.new);
      setPwSuccess(true);
      setTimeout(async () => {
        setShowPwModal(false);
        await logout();
        navigate('/login');
      }, 1500);
    } catch (e) {
      setPwError(e.response?.data?.detail || '비밀번호 변경에 실패했습니다.');
    }
    setPwLoading(false);
  };

  const handleOpenHistory = async () => {
    setShowUserMenu(false);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const res = await getLoginHistory();
      setLoginHistory(res.data);
    } catch {
      setLoginHistory([]);
    }
    setHistoryLoading(false);
  };

  const statusLabel = (s) => {
    if (s === 'success') return { text: '성공', color: '#16A34A', bg: '#DCFCE7' };
    if (s === 'failed') return { text: '실패', color: '#DC2626', bg: '#FEE2E2' };
    return { text: '잠금', color: '#7C3AED', bg: '#EDE9FE' };
  };

  return (
    <>
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
            IT 자산관리시스템
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
                    minWidth: '160px',
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
                  {isAdmin && (
                    <button
                      onClick={handleOpenHistory}
                      className="w-full px-4 py-2.5 text-left text-xs font-medium text-gray-600 hover:bg-gray-50 transition flex items-center gap-2"
                    >
                      로그인 이력
                    </button>
                  )}
                  <button
                    onClick={handleOpenPwModal}
                    className="w-full px-4 py-2.5 text-left text-xs font-medium text-gray-600 hover:bg-gray-50 transition flex items-center gap-2"
                  >
                    비밀번호 변경
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-left text-xs font-medium hover:bg-gray-50 transition flex items-center gap-2 border-t border-gray-50"
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

      {/* 비밀번호 변경 모달 */}
      {showPwModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl p-6 w-96" style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <h3 className="text-base font-bold text-gray-800 mb-5">비밀번호 변경</h3>
            {pwSuccess ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#DCFCE7' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-700">비밀번호가 변경되었습니다.</p>
                <p className="text-xs text-gray-400 mt-1">보안을 위해 다시 로그인해주세요.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {[
                  { label: '현재 비밀번호', key: 'old', placeholder: '현재 비밀번호를 입력하세요' },
                  { label: '새 비밀번호', key: 'new', placeholder: '8자 이상 입력하세요' },
                  { label: '새 비밀번호 확인', key: 'confirm', placeholder: '새 비밀번호를 다시 입력하세요' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">{label}</label>
                    <input
                      type="password"
                      value={pwForm[key]}
                      onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
                      placeholder={placeholder}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                      style={{ transition: 'border-color 0.2s, box-shadow 0.2s' }}
                      onFocus={inputFocus}
                      onBlur={inputBlur}
                    />
                  </div>
                ))}
                {pwError && (
                  <div className="px-3 py-2 rounded-xl text-xs text-white flex items-center gap-2" style={{ backgroundColor: '#C62828' }}>
                    <span>⚠️</span><span>{pwError}</span>
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleChangePassword}
                    disabled={pwLoading}
                    className="flex-1 text-white py-2.5 rounded-xl text-sm font-semibold transition"
                    style={{ backgroundColor: pwLoading ? '#93C5FD' : '#003DA5', cursor: pwLoading ? 'not-allowed' : 'pointer' }}
                  >
                    {pwLoading ? '변경 중...' : '변경'}
                  </button>
                  <button
                    onClick={() => setShowPwModal(false)}
                    className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 로그인 이력 모달 */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl flex flex-col" style={{ width: '680px', maxHeight: '80vh', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-base font-bold text-gray-800">로그인 이력</h3>
                <p className="text-xs text-gray-400 mt-0.5">최근 300건</p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="overflow-auto flex-1">
              {historyLoading ? (
                <div className="text-center py-12 text-gray-400 text-sm">불러오는 중...</div>
              ) : loginHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">이력이 없습니다.</div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr>
                      {['사용자', 'IP', '결과', '실패사유', '일시'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-semibold text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loginHistory.map((h) => {
                      const s = statusLabel(h.status);
                      return (
                        <tr key={h.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-medium text-gray-700">{h.username}</td>
                          <td className="px-4 py-2.5 text-gray-500 font-mono">{h.ip_address || '-'}</td>
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: s.bg, color: s.color }}>{s.text}</span>
                          </td>
                          <td className="px-4 py-2.5 text-gray-400">{h.fail_reason || '-'}</td>
                          <td className="px-4 py-2.5 text-gray-400">{new Date(h.created_at).toLocaleString('ko-KR')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AppHeader;
