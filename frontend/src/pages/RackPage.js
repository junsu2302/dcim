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
  const [newRackTotalU, setNewRackTotalU] = useState(42);
  const [editingRack, setEditingRack] = useState(null);
  const [editForm, setEditForm] = useState({ rack_number: '', site: '본사', total_u: 42 });
  const [editError, setEditError] = useState(null);
  const [showAddRack, setShowAddRack] = useState(false);
const [addRackTargetSite, setAddRackTargetSite] = useState(null);
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
    const siteRacks = racks.filter((r) => r.site === addRackTargetSite);
    const nextNumber = siteRacks.length > 0
      ? Math.max(...siteRacks.map((r) => r.rack_number)) + 1
      : 1;
    await createRack({ rack_number: nextNumber, site: addRackTargetSite, total_u: parseInt(newRackTotalU) });
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
    const newTotalU = parseInt(editForm.total_u);
    const devicesInRack = devices.filter(d => d.rack_id === rack.id);
    const outOfRange = devicesInRack.filter(d => (d.u_position + (d.u_size || 1) - 1) > newTotalU);
    
    if (outOfRange.length > 0) {
      const names = outOfRange.map(d => `${d.name} (${d.u_position}U~${d.u_position + (d.u_size||1) - 1}U)`).join(', ');
      setEditError(`${newTotalU}U로 줄일 수 없습니다. 범위를 벗어나는 장비가 있습니다: ${names}`);
      return;
    }
    setEditError(null);
    await updateRack(rack.id, { rack_number: number, site: editForm.site, total_u: newTotalU });
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
            <h1 className="text-lg font-bold tracking-wide text-white">IT 인프라 관리 시스템</h1>
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
        <div className="flex items-center p-1 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
          {[{ label: '랙 실장도', path: '/' }, { label: '장비 리스트', path: '/devices' }].map((tab) => (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
              style={{
                backgroundColor: tab.path === '/' ? 'white' : 'transparent',
                color: tab.path === '/' ? '#003DA5' : 'rgba(255,255,255,0.7)',
                minWidth: '80px',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 랙 추가 모달 */}
      {showAddRack && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-80">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#003DA5' }}></div>
              <h3 className="text-lg font-bold" style={{ color: '#003DA5' }}>랙 추가</h3>
            </div>
            <p className="text-xs text-gray-400 mb-5 ml-3">
              <span className="font-semibold text-gray-600">{addRackTargetSite}</span>에 새 랙을 추가합니다.
            </p>
            <label className="text-sm font-medium text-gray-600 mb-2 block">랙 크기 선택</label>
            <div className="grid grid-cols-3 gap-2">
              {[14, 18, 24, 36, 42, 48].map((u) => (
                <button
                  key={u}
                  onClick={() => setNewRackTotalU(u)}
                  className="py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: parseInt(newRackTotalU) === u ? '#003DA5' : '#F4F6FA',
                    color: parseInt(newRackTotalU) === u ? 'white' : '#555',
                    transform: parseInt(newRackTotalU) === u ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: parseInt(newRackTotalU) === u ? '0 4px 12px rgba(0,61,165,0.25)' : 'none',
                  }}
                >
                  {u}U
                </button>
              ))}
            </div>
            <div className="mt-4 px-3 py-2 rounded-lg text-xs text-gray-500 flex items-center gap-1.5"
              style={{ backgroundColor: '#F4F6FA' }}>
              <span>🔢</span>
              <span>랙 번호는 자동으로 부여됩니다.</span>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={handleAddRack}
                className="flex-1 text-white py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90"
                style={{ backgroundColor: '#003DA5' }}
              >
                추가
              </button>
              <button
                onClick={() => setShowAddRack(false)}
                className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
              >
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
                      <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: '#003DA5' }}></div>
                      <h2 className="text-xl font-bold text-gray-800">{site}</h2>
                      <span className="text-sm font-medium px-3 py-0.5 rounded-full" style={{ backgroundColor: '#E8EEFF', color: '#003DA5' }}>
                        랙 {siteRacks.length}개
                      </span>
                    </div>
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <button
                      onClick={() => { setAddRackTargetSite(site); setNewRackTotalU(42); setShowAddRack(true); }}
                      className="text-white px-4 py-1.5 rounded-lg text-sm font-medium transition hover:opacity-90"
                      style={{ backgroundColor: '#003DA5' }}
                    >
                      + 랙 추가
                    </button>
                  </div>

                  {/* 랙 카드들 */}
                  <div className="flex gap-4 flex-wrap">
                    {siteRacks.map((rack) => (
                      <div key={rack.id} className="flex flex-col gap-1">
                        {/* 랙 수정/삭제 */}
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setEditingRack(rack.id); setEditForm({ rack_number: rack.rack_number, site: rack.site, total_u: rack.total_u || 42 }); setEditError(null); }}
                            className="text-xs text-yellow-500 hover:text-yellow-600 transition">✏️ 수정</button>
                          <button onClick={() => handleDeleteRack(rack)}
                            className="text-xs text-red-400 hover:text-red-600 transition">🗑️ 삭제</button>
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

      {/* 랙 수정 모달 */}
      {editingRack && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-96">
            <h3 className="text-lg font-bold mb-1" style={{ color: '#003DA5' }}>🖥️ 랙 수정</h3>
            <p className="text-xs text-gray-400 mb-5">랙 정보를 수정합니다.</p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">사이트</label>
                <div className="flex gap-2">
                  {SITES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setEditForm({ ...editForm, site: s })}
                      className="flex-1 py-2 rounded-lg text-sm font-medium transition"
                      style={{
                        backgroundColor: editForm.site === s ? '#003DA5' : '#F4F6FA',
                        color: editForm.site === s ? 'white' : '#555',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">랙 번호</label>
                <input
                  type="number"
                  value={editForm.rack_number}
                  onChange={(e) => setEditForm({ ...editForm, rack_number: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': '#003DA5' }}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">랙 크기</label>
                <div className="grid grid-cols-3 gap-2">
                  {[14, 18, 24, 36, 42, 48].map((u) => (
                    <button
                      key={u}
                      onClick={() => setEditForm({ ...editForm, total_u: u })}
                      className="py-2 rounded-lg text-sm font-medium transition"
                      style={{
                        backgroundColor: editForm.total_u === u || parseInt(editForm.total_u) === u ? '#003DA5' : '#F4F6FA',
                        color: editForm.total_u === u || parseInt(editForm.total_u) === u ? 'white' : '#555',
                      }}
                    >
                      {u}U
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {editError && (
              <div className="mt-4 px-4 py-3 rounded-xl text-sm font-medium text-white flex items-start gap-2"
                style={{ backgroundColor: '#C62828' }}>
                <span className="mt-0.5">⚠️</span>
                <span>{editError}</span>
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => handleEditConfirm(racks.find(r => r.id === editingRack))}
                className="flex-1 text-white py-2.5 rounded-lg text-sm font-medium transition hover:opacity-90"
                style={{ backgroundColor: '#003DA5' }}
              >
                저장
              </button>
              <button
                onClick={() => { setEditingRack(null); setEditError(null); }}
                className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RackPage;