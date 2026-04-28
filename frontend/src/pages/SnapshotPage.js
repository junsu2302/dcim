import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSnapshots, getSnapshot, deleteSnapshot } from '../api/snapshots';

const DEVICE_TYPES = {
  '보안': { bg: '#C62828' },
  '네트워크': { bg: '#1565C0' },
  '서버': { bg: '#2E7D32' },
  '기타': { bg: '#6D4C41' },
};

const NAV_TABS = [
  { label: '랙 실장도', path: '/' },
  { label: '장비 리스트', path: '/devices' },
  { label: '이력 관리', path: '/snapshots' },
];

function SnapshotPage() {
  const [snapshots, setSnapshots] = useState([]);
  const [selected, setSelected] = useState(null);
  const [viewTab, setViewTab] = useState('rack');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchSnapshots(); }, []);

  const fetchSnapshots = async () => {
    const res = await getSnapshots();
    setSnapshots(res.data);
  };

  const handleSelect = async (id) => {
    const res = await getSnapshot(id);
    setSelected(res.data);
    setViewTab('rack');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('스냅샷을 삭제하시겠습니까?')) return;
    await deleteSnapshot(id);
    if (selected?.id === id) setSelected(null);
    fetchSnapshots();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6FA' }}>
      {/* 헤더 */}
      <div className="text-white px-8 py-4 flex justify-between items-center shadow-lg" style={{ backgroundColor: '#003DA5' }}>
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition" onClick={() => navigate('/')}>
          <img src={require('../assets/header_logo.png')} alt="IBK시스템" style={{ height: '32px' }} />
          <div className="w-px h-6 bg-white opacity-30"></div>
          <h1 className="text-lg font-bold tracking-wide text-white">IT 인프라 관리 시스템</h1>
        </div>
        <div className="flex items-center p-1 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
          {NAV_TABS.map((tab) => (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
              style={{
                backgroundColor: tab.path === '/snapshots' ? 'white' : 'transparent',
                color: tab.path === '/snapshots' ? '#003DA5' : 'rgba(255,255,255,0.7)',
                minWidth: '80px',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex h-[calc(100vh-68px)]">
        {/* 좌측 스냅샷 목록 */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-700">저장된 스냅샷</h2>
            <p className="text-xs text-gray-400 mt-0.5">총 {snapshots.length}개</p>
          </div>
          <div className="overflow-y-auto flex-1">
            {snapshots.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">저장된 이력이 없습니다.</div>
            ) : snapshots.map((s) => (
              <div
                key={s.id}
                onClick={() => handleSelect(s.id)}
                className="px-4 py-3 border-b border-gray-100 cursor-pointer transition hover:bg-blue-50"
                style={{ backgroundColor: selected?.id === s.id ? '#E8EEFF' : 'white' }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate" style={{ color: '#003DA5' }}>
                      {s.memo || '(메모 없음)'}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {new Date(s.saved_at).toLocaleString('ko-KR')}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                    className="text-xs text-red-400 hover:text-red-600 transition ml-2 flex-shrink-0"
                  >삭제</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 우측 스냅샷 뷰 */}
        <div className="flex-1 overflow-auto">
          {!selected ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-3">📋</div>
                <div>좌측에서 스냅샷을 선택하세요.</div>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {/* 스냅샷 정보 */}
              <div className="bg-white rounded-xl p-4 mb-4 flex items-center justify-between shadow-sm">
                <div>
                  <div className="font-bold text-gray-800">{selected.memo || '(메모 없음)'}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{new Date(selected.saved_at).toLocaleString('ko-KR')}</div>
                </div>
                {/* 뷰 탭 */}
                <div className="flex items-center p-1 rounded-lg" style={{ backgroundColor: '#F4F6FA' }}>
                  {[{ key: 'rack', label: '랙 실장도' }, { key: 'list', label: '장비 리스트' }].map(t => (
                    <button
                      key={t.key}
                      onClick={() => setViewTab(t.key)}
                      className="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
                      style={{
                        backgroundColor: viewTab === t.key ? '#003DA5' : 'transparent',
                        color: viewTab === t.key ? 'white' : '#888',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
{/* 장비 클릭 모달 */}
              {selectedDevice && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl shadow-2xl p-6 w-96">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#003DA5' }}></div>
                      <h3 className="text-lg font-bold" style={{ color: '#003DA5' }}>{selectedDevice.name}</h3>
                    </div>
                    <p className="text-xs text-gray-400 mb-4 ml-3">{selectedDevice.manufacturer} · {selectedDevice.serial}</p>

                    <label className="text-sm font-medium text-gray-600 mb-2 block">첨부 문서</label>
                    {selected.data.documents.filter(d => d.device_id === selectedDevice.id).length === 0 ? (
                      <div className="text-center py-6 text-gray-400 text-sm">첨부된 문서가 없습니다.</div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {selected.data.documents.filter(d => d.device_id === selectedDevice.id).map(doc => (
                          <a
                            key={doc.id}
                            href={`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/documents/download/${doc.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-blue-50 transition"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-700 truncate max-w-[180px]">{doc.original_name}</span>
                            </div>
                            <span className="text-xs text-blue-500 font-medium">다운로드</span>
                          </a>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedDevice(null)}
                      className="w-full mt-5 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              )}
              {/* 랙 실장도 뷰 */}
              {viewTab === 'rack' && (
                <div className="flex flex-col gap-8">
                  {['본사', '하남IDC'].map(site => {
                    const siteRacks = selected.data.racks.filter(r => r.site === site);
                    if (siteRacks.length === 0) return null;
                    return (
                      <div key={site}>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: '#003DA5' }}></div>
                          <h2 className="text-xl font-bold text-gray-800">{site}</h2>
                          <span className="text-sm font-medium px-3 py-0.5 rounded-full" style={{ backgroundColor: '#E8EEFF', color: '#003DA5' }}>
                            랙 {siteRacks.length}개
                          </span>
                        </div>
                        <div className="flex gap-4 flex-wrap">
                          {siteRacks.map(rack => {
                            const rackDevices = selected.data.devices.filter(d => d.rack_id === rack.id);
                            const totalU = rack.total_u || 42;
                            const slotMap = {};
rackDevices.forEach(d => {
                                      const size = d.u_size || 1;
                                      for (let i = 0; i < size; i++) {
                                        slotMap[d.u_position + i] = { ...d, isStart: i === size - 1, size };
                                      }
                                    });
                            const rendered = new Set();
                            return (
                              <div key={rack.id} className="rounded-2xl overflow-hidden shadow-lg border border-gray-200 w-72">
                                <div className="text-white px-4 py-3" style={{ background: 'linear-gradient(135deg, #003DA5, #0055CC)' }}>
                                  <div className="text-xs font-semibold uppercase tracking-widest mb-0.5 opacity-60">{rack.site}</div>
                                  <div className="text-xl font-bold tracking-wide">🖥️ RACK #{rack.rack_number}</div>
                                  <div className="text-xs mt-0.5 opacity-60">
                                    {rackDevices.length}개 장비 / {totalU - rackDevices.reduce((a, d) => a + (d.u_size || 1), 0)}U 여유
                                  </div>
                                </div>
                                <div className="bg-gray-50">
                                  {Array.from({ length: totalU }, (_, i) => totalU - i).map(u => {
                                    if (rendered.has(u)) return null;
                                    const slot = slotMap[u];
                                    if (slot?.isStart) {
                                      const actualStart = u - slot.size + 1;
                                      for (let i = 0; i < slot.size; i++) rendered.add(actualStart + i);
                                      return (
                                        <div key={u} className="relative border-b border-gray-100"
                                          style={{ height: `${slot.size * 34}px` }}>
                                          {Array.from({ length: slot.size }, (_, i) => (
                                            <div key={i} className="flex items-center px-2 gap-2" style={{ height: '34px' }}>
                                              <div className="text-xs text-gray-400 w-8 font-mono">{u - i}U</div>
                                            </div>
                                          ))}
                                          <div
                                            onClick={() => setSelectedDevice(slot)}
                                            className="absolute text-white rounded px-2 py-1 text-xs font-medium flex justify-between items-center cursor-pointer hover:opacity-80 transition"
                                            style={{
                                              top: '4px', bottom: '4px', left: '48px', right: '8px',
                                              backgroundColor: DEVICE_TYPES[slot.device_type]?.bg || DEVICE_TYPES['기타'].bg
                                            }}>
                                            <span className="truncate">{slot.name}</span>
                                            <span className="ml-1 opacity-70">{slot.size}U</span>
                                          </div>
                                        </div>
                                      );
                                    }
                                    if (!rendered.has(u)) rendered.add(u);
                                    return (
                                      <div key={u} className="flex items-center border-b border-gray-100 px-2 bg-white" style={{ minHeight: '34px' }}>
                                        <div className="text-xs text-gray-400 w-8 font-mono">{u}U</div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 장비 리스트 뷰 */}
              {viewTab === 'list' && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: '#003DA5' }}>
                        {['구분', '장비명', '제조사', '시리얼', 'U위치', 'U사이즈', '도입일', '유지보수 업체', '사이트', '랙번호', '첨부문서'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-white font-medium text-xs">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selected.data.devices.map((device, idx) => {
                        const docs = selected.data.documents.filter(d => d.device_id === device.id);
                        return (
                          <tr key={device.id} className="border-b border-gray-100"
                            style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#FAFBFF' }}>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                                style={{ backgroundColor: DEVICE_TYPES[device.device_type]?.bg || DEVICE_TYPES['기타'].bg }}>
                                {device.device_type || '기타'}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-xs" style={{ color: '#003DA5' }}>{device.name}</td>
                            <td className="px-4 py-3 text-gray-600 text-xs">{device.manufacturer}</td>
                            <td className="px-4 py-3 text-gray-500 font-mono text-xs">{device.serial}</td>
                            <td className="px-4 py-3 text-gray-600 text-xs">{device.u_position}U</td>
                            <td className="px-4 py-3 text-gray-600 text-xs">{device.u_size}U</td>
                            <td className="px-4 py-3 text-gray-600 text-xs">{device.introduced_date}</td>
                            <td className="px-4 py-3 text-gray-600 text-xs">{device.maintenance_company}</td>
                            <td className="px-4 py-3 text-xs">
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{ backgroundColor: device.site === '본사' ? '#E8EEFF' : '#FFF3E0', color: device.site === '본사' ? '#003DA5' : '#E65100' }}>
                                {device.site}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600 text-xs">RACK #{device.rack_id}</td>
                            <td className="px-4 py-3 text-xs">
                              {docs.length === 0 ? (
                                <span className="text-gray-300">-</span>
                              ) : (
                                <div className="flex flex-col gap-1">
                                  {docs.map(doc => (
                                    <a
                                      key={doc.id}
                                      href={`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/documents/download/${doc.id}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-1 hover:opacity-70 transition"
                                    >
                                      <span className="px-1.5 py-0.5 rounded text-xs"
                                        style={{ backgroundColor: '#E8EEFF', color: '#003DA5' }}>
                                        {doc.doc_type}
                                      </span>
                                      <span className="text-xs text-blue-400 truncate max-w-[80px]">{doc.original_name}</span>
                                    </a>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {selected.data.devices.length === 0 && (
                    <div className="text-center py-16 text-gray-400">등록된 장비가 없습니다.</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SnapshotPage;