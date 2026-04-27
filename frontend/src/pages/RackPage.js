import React, { useEffect, useState } from 'react';
import { getDevices } from '../api/devices';
import { getRacks, createRack, updateRack, deleteRack } from '../api/racks';
import RackView from '../components/RackView';
import { useNavigate } from 'react-router-dom';

const SITES = ['본사', '하남IDC'];

function RackPage() {
  const [devices, setDevices] = useState([]);
  const [racks, setRacks] = useState([]);
  const [selectedSite, setSelectedSite] = useState('전체');
  const [newRackNumber, setNewRackNumber] = useState('');
  const [newRackSite, setNewRackSite] = useState('본사');
  const [newRackTotalU, setNewRackTotalU] = useState(42);
  const [editingRack, setEditingRack] = useState(null);
  const [editForm, setEditForm] = useState({ rack_number: '', site: '본사', total_u: 42 });
  const [showAddRack, setShowAddRack] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAll();
  }, []);

  const [renderKey, setRenderKey] = useState(0);

  const fetchAll = async () => {
    const [devRes, rackRes] = await Promise.all([getDevices(), getRacks()]);
    setDevices(devRes.data);
    setRacks(rackRes.data);
    setRenderKey(k => k + 1);
  };


  const handleAddRack = async () => {
    const number = parseInt(newRackNumber);
    if (!number) return alert('랙 번호를 입력해주세요.');
    const exists = racks.some((r) => r.rack_number === number && r.site === newRackSite);
    if (exists) return alert('해당 사이트에 이미 존재하는 랙 번호입니다.');
    await createRack({ rack_number: number, site: newRackSite, total_u: parseInt(newRackTotalU) });
    setNewRackNumber('');
    setShowAddRack(false);
    fetchAll();
  };

  const handleDeleteRack = async (rack) => {
    const hasDevice = devices.some((d) => d.rack_id === rack.id);
    if (hasDevice) return alert('해당 랙에 장비가 있어 삭제할 수 없습니다.');
    if (window.confirm(`[${rack.site}] RACK #${rack.rack_number}을 삭제하시겠습니까?`)) {
      await deleteRack(rack.id);
      fetchAll();
    }
  };

  const handleEditConfirm = async (rack) => {
    const number = parseInt(editForm.rack_number);
    if (!number) return alert('랙 번호를 입력해주세요.');
    await updateRack(rack.id, { rack_number: number, site: editForm.site, total_u: parseInt(editForm.total_u) });
    setEditingRack(null);
    fetchAll();
  };

  const filteredRacks = selectedSite === '전체'
    ? racks
    : racks.filter((r) => r.site === selectedSite);

  // Site별로 그룹핑
  const groupedRacks = SITES.reduce((acc, site) => {
    acc[site] = filteredRacks.filter((r) => r.site === site);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 상단 네비게이션 */}
      <div className="text-white px-8 py-4 flex justify-between items-center shadow-lg" style={{ backgroundColor: '#003DA5' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition" onClick={() => navigate('/')}>
            <img src={require('../assets/header_logo.png')} alt="IBK시스템" style={{ height: '32px' }} />
            <div className="w-px h-6 bg-white opacity-30"></div>
            <h1 className="text-lg font-bold tracking-wide text-white">DCIM</h1>
          </div>
          {/* Site 탭 */}
          <div className="flex gap-1 ml-6">
            {['전체', ...SITES].map((site) => (
              <button
                key={site}
                onClick={() => setSelectedSite(site)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition`}
              style={{ backgroundColor: selectedSite === site ? '#FFB81C' : 'transparent', color: 'white' }}
              >
                {site}
                {site !== '전체' && (
                  <span className="ml-1.5 text-xs opacity-70">
                    ({racks.filter((r) => r.site === site).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddRack(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
          >
            + 랙 추가
          </button>
          <button
            onClick={() => navigate('/devices')}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-600 transition"
          >
            📋 장비 목록
          </button>
        </div>
      </div>

      {/* 랙 추가 모달 */}
      {showAddRack && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-96">
            <h3 className="text-lg font-bold text-gray-800 mb-4">+ 랙 추가</h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">사이트</label>
                <select
                  value={newRackSite}
                  onChange={(e) => setNewRackSite(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SITES.map((site) => <option key={site} value={site}>{site}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">랙 번호</label>
                <input
                  type="number"
                  value={newRackNumber}
                  onChange={(e) => setNewRackNumber(e.target.value)}
                  placeholder="예: 1"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">랙 크기 (U)</label>
                <select
                  value={newRackTotalU}
                  onChange={(e) => setNewRackTotalU(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[14, 18, 24, 36, 42, 48].map((u) => (
                    <option key={u} value={u}>{u}U</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={handleAddRack} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                추가
              </button>
              <button onClick={() => setShowAddRack(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition">
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 랙 실장도 본문 */}
      <div className="p-8">
        {filteredRacks.length === 0 ? (
          <div className="text-center py-20 text-gray-400 bg-white rounded-xl shadow">
            등록된 랙이 없습니다. 상단 "+ 랙 추가" 버튼으로 랙을 추가해주세요.
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {SITES.map((site) => {
              const siteRacks = groupedRacks[site];
              if (selectedSite !== '전체' && selectedSite !== site) return null;
              if (siteRacks.length === 0) return null;
              return (
                <div key={site}>
                  {/* Site 구분 헤더 */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-8 bg-blue-500 rounded-full"></div>
                      <h2 className="text-xl font-bold text-gray-800">{site}</h2>
                      <span className="bg-blue-100 text-blue-600 text-sm font-medium px-3 py-0.5 rounded-full">
                        랙 {siteRacks.length}개
                      </span>
                    </div>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>

                  {/* 랙 카드들 */}
                  <div className="flex gap-4 flex-wrap">
                    {siteRacks.map((rack) => (
                      <div key={rack.id} className="flex flex-col gap-1">
                        {/* 랙 수정/삭제 */}
                        <div className="flex justify-end gap-2">
                          {editingRack === rack.id ? (
                            <div className="flex items-center gap-1">
                              <select
                                value={editForm.site}
                                onChange={(e) => setEditForm({ ...editForm, site: e.target.value })}
                                className="border border-gray-300 rounded px-2 py-1 text-xs"
                              >
                                {SITES.map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <input
                                type="number"
                                value={editForm.rack_number}
                                onChange={(e) => setEditForm({ ...editForm, rack_number: e.target.value })}
                                className="border border-gray-300 rounded px-2 py-1 w-16 text-xs"
                              />
                              <select
                                value={editForm.total_u}
                                onChange={(e) => setEditForm({ ...editForm, total_u: e.target.value })}
                                className="border border-gray-300 rounded px-2 py-1 text-xs"
                              >
                                {[14, 18, 24, 36, 42, 48].map((u) => (
                                  <option key={u} value={u}>{u}U</option>
                                ))}
                              </select>
                              <button onClick={() => handleEditConfirm(rack)} className="text-xs bg-yellow-400 text-white px-2 py-1 rounded hover:bg-yellow-500">확인</button>
                              <button onClick={() => setEditingRack(null)} className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-400">취소</button>
                            </div>
                          ) : (
                            <>
                              <button onClick={() => { setEditingRack(rack.id); setEditForm({ rack_number: rack.rack_number, site: rack.site, total_u: rack.total_u || 42 }); }}
                                className="text-xs text-yellow-500 hover:text-yellow-600">✏️ 수정</button>
                              <button onClick={() => handleDeleteRack(rack)}
                                className="text-xs text-red-400 hover:text-red-600">🗑️ 삭제</button>
                            </>
                          )}
                        </div>
                        <RackView key={`${rack.id}-${renderKey}`} rack={rack} devices={devices} allRacks={racks} allDevices={devices} onRefresh={fetchAll} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default RackPage;