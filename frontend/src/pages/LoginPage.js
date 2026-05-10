import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

function Spinner() {
  return (
    <svg
      width="18" height="18" viewBox="0 0 18 18" fill="none"
      style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}
    >
      <circle cx="9" cy="9" r="7" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" />
      <path d="M9 2a7 7 0 0 1 7 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) return setError('아이디와 비밀번호를 입력해주세요.');
    setLoading(true);
    setError('');
    try {
      const res = await loginApi(username, password);
      login(res.data.access_token, {
        username: res.data.username,
        role: res.data.role,
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || '로그인에 실패했습니다.');
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #001240 0%, #003DA5 50%, #001240 100%)',
        backgroundSize: '300% 300%',
        animation: 'gradientShift 8s ease infinite',
      }}
    >
      {/* 배경 글로우 오브 */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '600px', height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,100,255,0.18) 0%, transparent 70%)',
          top: '-100px', left: '-100px',
          animation: 'bgPulse 6s ease-in-out infinite',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: '400px', height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,184,28,0.1) 0%, transparent 70%)',
          bottom: '-50px', right: '-50px',
          animation: 'bgPulse 7s ease-in-out infinite reverse',
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* 로고 */}
        <div
          className="text-center mb-8"
          style={{ animation: 'fadeIn 0.5s ease 0.1s both' }}
        >
          <img
            src={require('../assets/header_logo.png')}
            alt="IBK시스템"
            className="h-10 mx-auto mb-4"
          />
          <h1 className="text-xl font-bold text-white">IT 인프라 관리 시스템</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
            IBK시스템 내부 관리자 전용
          </p>
        </div>

        {/* 로그인 카드 */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.97)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.28), 0 4px 16px rgba(0,0,0,0.12)',
            animation: 'slideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both',
          }}
        >
          <h2 className="text-base font-bold text-gray-700 mb-6">로그인</h2>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">아이디</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="아이디를 입력하세요"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                style={{
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#003DA5';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0,61,165,0.12)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E5E7EB';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                style={{ transition: 'border-color 0.2s, box-shadow 0.2s' }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#003DA5';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0,61,165,0.12)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E5E7EB';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {error && (
              <div
                className="px-4 py-3 rounded-xl text-xs font-medium text-white flex items-center gap-2"
                style={{
                  backgroundColor: '#C62828',
                  animation: 'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <span>⚠️</span><span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-white py-2.5 rounded-xl text-sm font-semibold mt-2 flex items-center justify-center gap-2"
              style={{
                backgroundColor: '#003DA5',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.85 : 1,
              }}
            >
              {loading ? <><Spinner /><span>로그인 중...</span></> : '로그인'}
            </button>
          </form>
        </div>

        <p
          className="text-center text-xs mt-5"
          style={{ color: 'rgba(255,255,255,0.3)', animation: 'fadeIn 0.5s ease 0.5s both' }}
        >
          © 2026 IBK시스템
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
