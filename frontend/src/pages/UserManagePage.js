import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUsers, createUser, updateUser, deleteUser } from '../api/auth';
import AppHeader from '../components/AppHeader';

function useToast() {
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);
  return { toasts, showToast };
}

const inputFocus = (e) => {
  e.target.style.borderColor = '#003DA5';
  e.target.style.boxShadow = '0 0 0 3px rgba(0,61,165,0.12)';
};
const inputBlur = (e) => {
  e.target.style.borderColor = '#E5E7EB';
  e.target.style.boxShadow = 'none';
};
const inputBaseStyle = { transition: 'border-color 0.2s, box-shadow 0.2s' };

function UserManagePage() {
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', role: 'viewer' });
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toasts, showToast } = useToast();

  useEffect(() => {
    if (user?.role !== 'admin') { navigate('/'); return; }
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch {
      showToast('사용자 목록을 불러오지 못했습니다.', 'error');
    }
  };

  const handleCreate = async () => {
    if (!form.username || !form.password) return setError('아이디와 비밀번호를 입력해주세요.');
    try {
      await createUser(form);
      setShowAddModal(false);
      setForm({ username: '', password: '', role: 'viewer' });
      setError('');
      fetchUsers();
      showToast('사용자가 추가되었습니다.', 'success');
    } catch (e) {
      setError(e.response?.data?.detail || '생성 중 오류가 발생했습니다.');
    }
  };

  const handleUpdate = async () => {
    try {
      await updateUser(editingUser.id, {
        password: form.password || undefined,
        role: form.role,
      });
      setEditingUser(null);
      setForm({ username: '', password: '', role: 'viewer' });
      setError('');
      fetchUsers();
      showToast('사용자 정보가 수정되었습니다.', 'success');
    } catch (e) {
      setError(e.response?.data?.detail || '수정 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async () => {
    try {
      const name = deleteTarget.username;
      await deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      setDeleteConfirmed(false);
      fetchUsers();
      showToast(`'${name}' 계정이 삭제되었습니다.`, 'error');
    } catch (e) {
      showToast(e.response?.data?.detail || '삭제 중 오류가 발생했습니다.', 'error');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6FA' }}>
      <AppHeader activePath="/users" />

      {/* 토스트 */}
      <div className="fixed z-[9999] flex flex-col gap-2" style={{ top: '68px', right: '24px' }}>
        {toasts.map(t => (
          <div
            key={t.id}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl text-white text-sm font-medium anim-slide-in-right"
            style={{
              backgroundColor: t.type === 'error' ? '#7F1D1D' : '#003DA5',
              minWidth: '260px',
              boxShadow: t.type === 'error'
                ? '0 8px 32px rgba(127,29,29,0.4)'
                : '0 8px 32px rgba(0,61,165,0.35)',
            }}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: t.type === 'error' ? '#F87171' : '#4ADE80', color: 'white' }}
            >
              {t.type === 'error' ? '✕' : '✓'}
            </div>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      <div className="px-8 py-6 max-w-3xl mx-auto anim-fade-in">
        {/* 페이지 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-7 rounded-full" style={{ backgroundColor: '#003DA5' }} />
              <h1 className="text-xl font-bold text-gray-800">사용자 관리</h1>
            </div>
            <p className="text-sm text-gray-400 mt-1 ml-4">시스템 접근 계정을 관리합니다.</p>
          </div>
          <button
            onClick={() => { setShowAddModal(true); setError(''); setForm({ username: '', password: '', role: 'viewer' }); }}
            className="btn-primary flex items-center gap-1.5 text-white px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: '#003DA5' }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1v11M1 6.5h11" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            사용자 추가
          </button>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: '전체 계정', value: users.length, color: '#003DA5', icon: '👥' },
            { label: '관리자', value: users.filter(u => u.role === 'admin').length, color: '#B8860B', bg: '#FFF8E1', icon: '⭐' },
            { label: '뷰어', value: users.filter(u => u.role === 'viewer').length, color: '#2E7D32', bg: '#F0FDF4', icon: '👁️' },
          ].map(stat => (
            <div
              key={stat.label}
              className="rounded-2xl p-4 flex items-center gap-3"
              style={{
                backgroundColor: stat.bg || '#EEF2FF',
                border: `1.5px solid ${stat.color}20`,
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: stat.color + '18' }}
              >
                {stat.icon}
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 계정 목록 */}
        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.07)', border: '1px solid #F1F5F9' }}
        >
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">계정 목록</span>
            <span className="text-xs text-gray-400">{users.length}개</span>
          </div>

          <div className="divide-y divide-gray-50">
            {users.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <div className="text-3xl mb-3">👤</div>
                <div className="text-sm">등록된 사용자가 없습니다.</div>
              </div>
            )}
            {users.map((u) => {
              const initial = u.username[0]?.toUpperCase() || '?';
              const isAdmin = u.role === 'admin';
              return (
                <div key={u.id} className="flex items-center px-6 py-4 hover:bg-gray-50 transition-colors">
                  {/* 아바타 */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 mr-4"
                    style={{ backgroundColor: isAdmin ? '#FFB81C' : '#003DA5' }}
                  >
                    {initial}
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">{u.username}</span>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: isAdmin ? '#FFF8E1' : '#E8EEFF',
                          color: isAdmin ? '#B8860B' : '#003DA5',
                        }}
                      >
                        {isAdmin ? '관리자' : '뷰어'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      생성일: {new Date(u.created_at).toLocaleString('ko-KR')}
                    </div>
                  </div>

                  {/* 버튼 */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => { setEditingUser(u); setForm({ username: u.username, password: '', role: u.role }); setError(''); }}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg transition hover:opacity-90"
                      style={{ backgroundColor: '#EEF2FF', color: '#003DA5' }}
                    >
                      수정
                    </button>
                    {u.username !== 'admin' && (
                      <button
                        onClick={() => { setDeleteTarget(u); setDeleteConfirmed(false); }}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg transition hover:opacity-90"
                        style={{ backgroundColor: '#FFF1F1', color: '#C62828' }}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 사용자 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 modal-overlay">
          <div className="bg-white rounded-2xl modal-card" style={{ width: '480px', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>

            {/* 모달 헤더 */}
            <div className="px-7 pt-7 pb-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#EEF2FF' }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="7" r="3.5" stroke="#003DA5" strokeWidth="1.7" />
                    <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="#003DA5" strokeWidth="1.7" strokeLinecap="round" />
                    <path d="M14 3v4M12 5h4" stroke="#003DA5" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800">사용자 추가</h3>
                  <p className="text-xs text-gray-400 mt-0.5">새 계정 정보를 입력하세요.</p>
                </div>
              </div>
            </div>

            {/* 폼 */}
            <div className="px-7 py-5 flex flex-col gap-5">

              {/* 아이디 */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  아이디 <span style={{ color: '#C62828' }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="영문, 숫자 조합으로 입력하세요"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none"
                  style={inputBaseStyle}
                  onFocus={inputFocus}
                  onBlur={inputBlur}
                />
              </div>

              {/* 비밀번호 */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  비밀번호 <span style={{ color: '#C62828' }}>*</span>
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="8자 이상 입력하세요"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none"
                  style={inputBaseStyle}
                  onFocus={inputFocus}
                  onBlur={inputBlur}
                />
              </div>

              {/* 권한 */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">권한</label>
                <div className="flex gap-3">
                  {[
                    {
                      value: 'viewer',
                      label: '뷰어',
                      desc: '조회 전용 · 수정 불가',
                      color: '#003DA5',
                      bg: '#EEF2FF',
                      icon: (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <ellipse cx="10" cy="10" rx="8" ry="5" stroke="currentColor" strokeWidth="1.6" />
                          <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6" />
                        </svg>
                      ),
                    },
                    {
                      value: 'admin',
                      label: '관리자',
                      desc: '전체 권한 · 사용자 관리',
                      color: '#B8860B',
                      bg: '#FFF8E1',
                      icon: (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M10 2l1.8 5.5H17l-4.6 3.3 1.8 5.5L10 13l-4.2 3.3 1.8-5.5L3 7.5h5.2L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                        </svg>
                      ),
                    },
                  ].map(r => {
                    const isSelected = form.role === r.value;
                    return (
                      <button
                        key={r.value}
                        onClick={() => setForm({ ...form, role: r.value })}
                        className="flex-1 rounded-xl p-4 text-left transition-all relative"
                        style={{
                          border: isSelected ? `2px solid ${r.color}` : '2px solid #E5E7EB',
                          backgroundColor: isSelected ? r.bg : 'white',
                          boxShadow: isSelected ? `0 4px 14px ${r.color}22` : 'none',
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5"
                          style={{
                            backgroundColor: isSelected ? r.color + '20' : '#F4F6FA',
                            color: isSelected ? r.color : '#9CA3AF',
                          }}
                        >
                          {r.icon}
                        </div>
                        <div
                          className="text-sm font-bold mb-0.5"
                          style={{ color: isSelected ? r.color : '#374151' }}
                        >
                          {r.label}
                        </div>
                        <div className="text-xs" style={{ color: isSelected ? r.color + 'CC' : '#9CA3AF' }}>
                          {r.desc}
                        </div>
                        {isSelected && (
                          <div
                            className="absolute top-3 right-3 w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: r.color }}
                          >
                            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                              <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div
                  className="px-4 py-3 rounded-xl text-sm text-white flex items-center gap-2"
                  style={{ backgroundColor: '#C62828', animation: 'slideDown 0.25s ease' }}
                >
                  <span>⚠️</span><span>{error}</span>
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div className="px-7 pb-7 flex gap-2">
              <button
                onClick={handleCreate}
                className="btn-primary flex-1 text-white py-3 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: '#003DA5' }}
              >계정 추가</button>
              <button
                onClick={() => { setShowAddModal(false); setError(''); }}
                className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
              >취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 사용자 수정 모달 */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 modal-overlay">
          <div className="bg-white rounded-2xl p-6 w-96 border border-gray-100 modal-card" style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ backgroundColor: editingUser.role === 'admin' ? '#FFB81C' : '#003DA5' }}
              >
                {editingUser.username[0]?.toUpperCase()}
              </div>
              <div>
                <div className="text-base font-bold text-gray-800">{editingUser.username}</div>
                <div className="text-xs text-gray-400">{editingUser.role === 'admin' ? '관리자' : '뷰어'} 계정 수정</div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                  새 비밀번호 <span className="text-gray-400 font-normal">(변경 시만 입력)</span>
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="변경하지 않으면 비워두세요"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  style={inputBaseStyle}
                  onFocus={inputFocus}
                  onBlur={inputBlur}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">권한</label>
                <div className="flex gap-2">
                  {[{ value: 'viewer', label: '뷰어' }, { value: 'admin', label: '관리자' }].map(r => (
                    <button
                      key={r.value}
                      onClick={() => setForm({ ...form, role: r.value })}
                      className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                      style={{
                        backgroundColor: form.role === r.value ? '#003DA5' : '#F4F6FA',
                        color: form.role === r.value ? 'white' : '#555',
                        boxShadow: form.role === r.value ? '0 4px 12px rgba(0,61,165,0.25)' : 'none',
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {error && (
              <div
                className="mt-3 px-4 py-2.5 rounded-xl text-xs text-white flex items-center gap-2"
                style={{ backgroundColor: '#C62828', animation: 'slideDown 0.25s ease' }}
              >
                <span>⚠️</span><span>{error}</span>
              </div>
            )}
            <div className="flex gap-2 mt-5">
              <button
                onClick={handleUpdate}
                className="btn-primary flex-1 text-white py-2.5 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: '#003DA5' }}
              >저장</button>
              <button
                onClick={() => { setEditingUser(null); setError(''); }}
                className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
              >취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 modal-overlay">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 modal-card" style={{ width: '380px', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: '#FEE2E2' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#C62828" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10 11v4M14 11v4" stroke="#C62828" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">사용자를 삭제하시겠습니까?</h3>
              <p className="text-xs text-gray-400">이 작업은 되돌릴 수 없습니다.</p>
            </div>
            <div className="rounded-xl px-4 py-3 mb-5" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex gap-3">
                  <span className="text-red-300 w-14 flex-shrink-0">아이디</span>
                  <span className="font-semibold text-red-700">{deleteTarget.username}</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-red-300 w-14 flex-shrink-0">권한</span>
                  <span className="text-red-600">{deleteTarget.role === 'admin' ? '관리자' : '뷰어'}</span>
                </div>
              </div>
            </div>
            <label className="flex items-center gap-2.5 mb-4 cursor-pointer select-none">
              <div
                onClick={() => setDeleteConfirmed(v => !v)}
                className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition"
                style={{
                  border: deleteConfirmed ? 'none' : '1.5px solid #FECACA',
                  backgroundColor: deleteConfirmed ? '#C62828' : 'white',
                }}
              >
                {deleteConfirmed && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-xs text-gray-500">위 내용을 확인했으며, 삭제에 동의합니다.</span>
            </label>
            <div className="flex gap-2">
              <button
                disabled={!deleteConfirmed}
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition"
                style={{
                  backgroundColor: deleteConfirmed ? '#C62828' : '#FCA5A5',
                  cursor: deleteConfirmed ? 'pointer' : 'not-allowed',
                }}
              >삭제</button>
              <button
                onClick={() => { setDeleteTarget(null); setDeleteConfirmed(false); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
              >취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagePage;
