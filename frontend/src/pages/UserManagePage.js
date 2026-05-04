import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUsers, createUser, updateUser, deleteUser } from '../api/auth';

const NAV_TABS = [
  { label: '랙 실장도', path: '/' },
  { label: '장비 리스트', path: '/devices' },
  { label: '이력 관리', path: '/snapshots' },
  { label: '사용자 관리', path: '/users' },
];

function UserManagePage() {
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', role: 'viewer' });
  const [error, setError] = useState('');
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const fetchUsers = async () => {
    try {
      const res = await getUsers(token);
      setUsers(res.data);
    } catch {
      setError('사용자 목록을 불러오지 못했습니다.');
    }
  };

  const handleCreate = async () => {
    if (!form.username || !form.password) return setError('아이디와 비밀번호를 입력해주세요.');
    try {
      await createUser(token, form);
      setShowAddModal(false);
      setForm({ username: '', password: '', role: 'viewer' });
      setError('');
      fetchUsers();
    } catch (e) {
      setError(e.response?.data?.detail || '생성 중 오류가 발생했습니다.');
    }
  };

  const handleUpdate = async () => {
    try {
      await updateUser(token, editingUser.id, {
        password: form.password || undefined,
        role: form.role,
      });
      setEditingUser(null);
      setForm({ username: '', password: '', role: 'viewer' });
      setError('');
      fetchUsers();
    } catch (e) {
      setError(e.response?.data?.detail || '수정 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('사용자를 삭제하시겠습니까?')) return;
    try {
      await deleteUser(token, id);
      fetchUsers();
    } catch (e) {
      setError(e.response?.data?.detail || '삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      {/* 헤더 */}
      <div className="text-white px-8 py-3 flex justify-between items-center" style={{ backgroundColor: '#003DA5', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition" onClick={() => navigate('/')}>
          <img src={require('../assets/header_logo.png')} alt="IBK시스템" style={{ height: '30px' }} />
          <div className="w-px h-5 bg-white opacity-20"></div>
          <span className="text-sm font-semibold tracking-wide opacity-90">IT 인프라 관리 시스템</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white bg-opacity-10 rounded-lg p-1">
            {NAV_TABS.map((tab) => (
              <button key={tab.path} onClick={() => navigate(tab.path)}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  backgroundColor: tab.path === '/users' ? 'white' : 'transparent',
                  color: tab.path === '/users' ? '#003DA5' : 'rgba(255,255,255,0.75)',
                }}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-white opacity-20"></div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>
            <span>👤</span>
            <span>{user?.username}</span>
            <span className="px-1.5 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: '#FFB81C', color: 'white' }}>관리자</span>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }}
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition"
            style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}>
            로그아웃
          </button>
        </div>
      </div>

      <div className="px-8 py-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">사용자 관리</h2>
            <p className="text-sm text-gray-400 mt-0.5">시스템 접근 계정을 관리합니다.</p>
          </div>
          <button
            onClick={() => { setShowAddModal(true); setError(''); setForm({ username: '', password: '', role: 'viewer' }); }}
            className="text-white px-4 py-2 rounded-xl text-sm font-semibold transition hover:opacity-90"
            style={{ backgroundColor: '#003DA5' }}
          >
            + 사용자 추가
          </button>
        </div>

        {/* 사용자 목록 */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#003DA5' }}>
                {['아이디', '권한', '생성일', '관리'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-white font-medium text-sm">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition"
                  style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#FAFBFF' }}>
                  <td className="px-6 py-4 font-medium text-gray-800">{u.username}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: u.role === 'admin' ? '#FFF3CD' : '#E8EEFF',
                        color: u.role === 'admin' ? '#856404' : '#003DA5',
                      }}>
                      {u.role === 'admin' ? '관리자' : '뷰어'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {new Date(u.created_at).toLocaleString('ko-KR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingUser(u); setForm({ username: u.username, password: '', role: u.role }); setError(''); }}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg transition hover:opacity-90"
                        style={{ backgroundColor: '#EEF2FF', color: '#003DA5' }}
                      >수정</button>
                      {u.username !== 'admin' && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg transition hover:opacity-90"
                          style={{ backgroundColor: '#FFEBEE', color: '#C62828' }}
                        >삭제</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 사용자 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-96 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#003DA5' }}></div>
              <h3 className="text-base font-bold" style={{ color: '#003DA5' }}>사용자 추가</h3>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">아이디</label>
                <input type="text" value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">비밀번호</label>
                <input type="password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">권한</label>
                <div className="flex gap-2">
                  {[{ value: 'viewer', label: '뷰어' }, { value: 'admin', label: '관리자' }].map(r => (
                    <button key={r.value} onClick={() => setForm({ ...form, role: r.value })}
                      className="flex-1 py-2 rounded-xl text-sm font-medium transition"
                      style={{ backgroundColor: form.role === r.value ? '#003DA5' : '#F4F6FA', color: form.role === r.value ? 'white' : '#555' }}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {error && (
              <div className="mt-3 px-4 py-2.5 rounded-xl text-xs text-white flex items-center gap-2" style={{ backgroundColor: '#C62828' }}>
                <span>⚠️</span><span>{error}</span>
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={handleCreate}
                className="flex-1 text-white py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90"
                style={{ backgroundColor: '#003DA5' }}>추가</button>
              <button onClick={() => { setShowAddModal(false); setError(''); }}
                className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 사용자 수정 모달 */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-96 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#003DA5' }}></div>
              <h3 className="text-base font-bold" style={{ color: '#003DA5' }}>{editingUser.username} 수정</h3>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">새 비밀번호 (변경 시만 입력)</label>
                <input type="password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="변경하지 않으면 비워두세요"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">권한</label>
                <div className="flex gap-2">
                  {[{ value: 'viewer', label: '뷰어' }, { value: 'admin', label: '관리자' }].map(r => (
                    <button key={r.value} onClick={() => setForm({ ...form, role: r.value })}
                      className="flex-1 py-2 rounded-xl text-sm font-medium transition"
                      style={{ backgroundColor: form.role === r.value ? '#003DA5' : '#F4F6FA', color: form.role === r.value ? 'white' : '#555' }}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {error && (
              <div className="mt-3 px-4 py-2.5 rounded-xl text-xs text-white flex items-center gap-2" style={{ backgroundColor: '#C62828' }}>
                <span>⚠️</span><span>{error}</span>
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={handleUpdate}
                className="flex-1 text-white py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90"
                style={{ backgroundColor: '#003DA5' }}>저장</button>
              <button onClick={() => { setEditingUser(null); setError(''); }}
                className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagePage;