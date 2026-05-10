import React, { useEffect, useState } from 'react';
import { getSnapshots, getSnapshot, deleteSnapshot } from '../api/snapshots';
import { getVMs } from '../api/vms';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/AppHeader';

const DEVICE_TYPES = {
  '보안': { bg: '#C62828' },
  '네트워크': { bg: '#1565C0' },
  '서버': { bg: '#2E7D32' },
  'VM서버': { bg: '#6A1B9A' },
  '기타': { bg: '#6D4C41' },
};

function SnapshotPage() {
  const [snapshots, setSnapshots] = useState([]);
  const [selected, setSelected] = useState(null);
  const [viewTab, setViewTab] = useState('rack');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectedDeviceTab, setSelectedDeviceTab] = useState('info');
  const [selectedDeviceVMs, setSelectedDeviceVMs] = useState([]);
  const [tooltip, setTooltip] = useState(null);
  const [snapshotFilterSite, setSnapshotFilterSite] = useState('전체');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleteToast, setDeleteToast] = useState(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!deleteToast) return;
    const t = setTimeout(() => setDeleteToast(null), 3000);
    return () => clearTimeout(t);
  }, [deleteToast]);

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

  const handleDelete = async () => {
    const name = deleteTarget.memo || '(저장명 없음)';
    await deleteSnapshot(deleteTarget.id);
    if (selected?.id === deleteTarget.id) setSelected(null);
    setDeleteTarget(null);
    setDeleteConfirmed(false);
    setDeleteToast(name);
    fetchSnapshots();
  };

  return (
    <>
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6FA' }}>
      <AppHeader activePath="/snapshots" />
        <div className="flex h-[calc(100vh-52px)]">
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
                      {s.memo || '(저장명 없음)'}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {s.saved_by && (
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#E8EEFF', color: '#003DA5' }}>
                          {s.saved_by}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(s.saved_at).toLocaleString('ko-KR')}
                      </span>
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(s); }}
                      className="text-xs text-red-400 hover:text-red-600 transition ml-2 flex-shrink-0"
                    >삭제</button>
                  )}
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
                  <div className="font-bold text-gray-800">{selected.memo || '(저장명 없음)'}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {selected.saved_by && (
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#E8EEFF', color: '#003DA5' }}>
                        {selected.saved_by}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{new Date(selected.saved_at).toLocaleString('ko-KR')}</span>
                  </div>
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
                  <div className="bg-white rounded-2xl shadow-2xl p-6 w-[480px]">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#003DA5' }}></div>
                      <h3 className="text-lg font-bold" style={{ color: '#003DA5' }}>{selectedDevice.name}</h3>
                    </div>
                    <p className="text-xs text-gray-400 mb-3 ml-3">{selectedDevice.manufacturer} · {selectedDevice.serial}</p>

                    {/* 탭 */}
                    <div className="flex gap-1 border-b border-gray-100 mb-4">
                      {[
                        { key: 'info', label: '장비 정보' },
                        ...(selectedDevice.device_type === 'VM서버' ? [{ key: 'vms', label: `VM (${selectedDeviceVMs.length})` }] : []),
                        { key: 'documents', label: '문서' },
                      ].map(t => (
                        <button key={t.key} onClick={() => setSelectedDeviceTab(t.key)}
                          className="px-4 py-2 text-xs font-medium transition-all"
                          style={{
                            color: selectedDeviceTab === t.key ? '#003DA5' : '#888',
                            borderBottom: selectedDeviceTab === t.key ? '2px solid #003DA5' : '2px solid transparent',
                          }}>
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {/* 장비 정보 탭 */}
                    {selectedDeviceTab === 'info' && (
                      <div className="flex flex-col gap-2 text-xs">
                        {[
                          { label: '장비명', value: selectedDevice.name },
                          { label: '제조사', value: selectedDevice.manufacturer },
                          { label: '모델명', value: selectedDevice.product_name },
                          { label: 'IP', value: selectedDevice.ip_address },
                          { label: '시리얼', value: selectedDevice.serial },
                          { label: '도입일', value: selectedDevice.introduced_date },
                          { label: '유지보수', value: selectedDevice.maintenance_company },
                          { label: 'U위치', value: selectedDevice.u_position ? `${selectedDevice.u_position}U` : null },
                          { label: 'U사이즈', value: selectedDevice.u_size ? `${selectedDevice.u_size}U` : null },
                        ].filter(item => item.value).map(item => (
                          <div key={item.label} className="flex gap-3">
                            <span className="text-gray-400 w-16 flex-shrink-0">{item.label}</span>
                            <span className="text-gray-700">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* VM 탭 */}
                    {selectedDeviceTab === 'vms' && (
                      <div className="flex flex-col gap-2">
                        {selectedDeviceVMs.length === 0 ? (
                          <div className="text-center py-6 text-gray-400 text-sm">등록된 VM이 없습니다.</div>
                        ) : selectedDeviceVMs.map(vm => (
                          <div key={vm.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50">
                            <div className="text-sm font-semibold mb-1.5" style={{ color: '#6A1B9A' }}>{vm.name}</div>
                            <div className="flex flex-col gap-0.5 text-xs text-gray-500">
                              {vm.ip_address && <div className="flex gap-2"><span className="text-gray-400 w-16">IP</span><span className="font-mono">{vm.ip_address}</span></div>}
                              {vm.host_nm && <div className="flex gap-2"><span className="text-gray-400 w-16">HOST</span><span>{vm.host_nm}</span></div>}
                              {vm.os && <div className="flex gap-2"><span className="text-gray-400 w-16">OS</span><span>{vm.os}</span></div>}
                              {vm.cpu && <div className="flex gap-2"><span className="text-gray-400 w-16">CPU</span><span>{vm.cpu}</span></div>}
                              {vm.core && <div className="flex gap-2"><span className="text-gray-400 w-16">CORE</span><span>{vm.core}</span></div>}
                              {vm.ram_gb && <div className="flex gap-2"><span className="text-gray-400 w-16">RAM(GB)</span><span>{vm.ram_gb}</span></div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 문서 탭 */}
                    {selectedDeviceTab === 'documents' && (
                      <div>
                        {selected.data.documents.filter(d => d.device_id === selectedDevice.id).length === 0 ? (
                          <div className="text-center py-6 text-gray-400 text-sm">첨부된 문서가 없습니다.</div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {selected.data.documents.filter(d => d.device_id === selectedDevice.id).map(doc => (
                              <a key={doc.id}
                                href={`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/documents/download/${doc.id}`}
                                target="_blank" rel="noreferrer"
                                className="flex items-center justify-between p-2 rounded-lg border border-gray-100 hover:bg-blue-50 transition"
                              >
                                <span className="text-sm text-gray-700 truncate max-w-[300px]">{doc.original_name}</span>
                                <span className="text-xs text-blue-500 font-medium flex-shrink-0 ml-2">다운로드</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <button onClick={() => setSelectedDevice(null)}
                      className="w-full mt-5 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">
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
                                            onClick={() => {
                                              setSelectedDevice(slot);
                                              setSelectedDeviceTab('info');
                                              if (slot.device_type === 'VM서버') {
                                                getVMs(slot.id).then(r => setSelectedDeviceVMs(r.data)).catch(() => {});
                                              }
                                            }}
                                            onMouseEnter={(e) => {
                                              const rect = e.currentTarget.getBoundingClientRect();
                                              setTooltip({ slot, x: rect.right + 8, y: rect.top + rect.height / 2 });
                                            }}
                                            onMouseLeave={() => setTooltip(null)}
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
                <div>
                  {/* 사이트 탭 + 통계 카드 */}
                  <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
                    <div className="flex gap-3 mb-5">
                      {[
                        { key: '전체', label: '전체', count: selected.data.devices.length },
                        { key: '본사', label: '본사', count: selected.data.devices.filter(d => d.site === '본사').length },
                        { key: '하남IDC', label: '하남IDC', count: selected.data.devices.filter(d => d.site === '하남IDC').length },
                      ].map(tab => (
                        <button
                          key={tab.key}
                          onClick={() => setSnapshotFilterSite(tab.key)}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                          style={{
                            backgroundColor: snapshotFilterSite === tab.key ? '#003DA5' : '#F4F6FA',
                            color: snapshotFilterSite === tab.key ? 'white' : '#555',
                            boxShadow: snapshotFilterSite === tab.key ? '0 4px 12px rgba(0,61,165,0.25)' : 'none',
                            transform: snapshotFilterSite === tab.key ? 'scale(1.03)' : 'scale(1)',
                          }}
                        >
                          <span>{tab.label}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                            style={{
                              backgroundColor: snapshotFilterSite === tab.key ? 'rgba(255,255,255,0.25)' : '#E5E7EB',
                              color: snapshotFilterSite === tab.key ? 'white' : '#555',
                            }}>
                            {tab.count}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-5 gap-4">
                      {[
                        { label: '전체 장비', value: selected.data.devices.filter(d => snapshotFilterSite === '전체' || d.site === snapshotFilterSite).length, color: '#003DA5', icon: '🖥️' },
                        { label: '보안', value: selected.data.devices.filter(d => d.device_type === '보안' && (snapshotFilterSite === '전체' || d.site === snapshotFilterSite)).length, color: '#C62828', icon: '🔒' },
                        { label: '네트워크', value: selected.data.devices.filter(d => d.device_type === '네트워크' && (snapshotFilterSite === '전체' || d.site === snapshotFilterSite)).length, color: '#1565C0', icon: '🌐' },
                        { label: '서버', value: selected.data.devices.filter(d => d.device_type === '서버' && (snapshotFilterSite === '전체' || d.site === snapshotFilterSite)).length, color: '#2E7D32', icon: '⚙️' },
                        { label: '기타', value: selected.data.devices.filter(d => (!d.device_type || d.device_type === '기타') && (snapshotFilterSite === '전체' || d.site === snapshotFilterSite)).length, color: '#6D4C41', icon: '📦' },
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-xl p-4 flex items-center gap-4"
                          style={{ backgroundColor: stat.color + '10', border: `1.5px solid ${stat.color}22` }}>
                          <div className="text-3xl w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: stat.color + '18' }}>
                            {stat.icon}
                          </div>
                          <div>
                            <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

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
                      {[...selected.data.devices].filter(d => snapshotFilterSite === '전체' || d.site === snapshotFilterSite).sort((a, b) => {
                        const siteOrder = { '본사': 0, '하남IDC': 1 };
                        const siteA = siteOrder[a.site] ?? 99;
                        const siteB = siteOrder[b.site] ?? 99;
                        if (siteA !== siteB) return siteA - siteB;
                        if (a.rack_id !== b.rack_id) return a.rack_id - b.rack_id;
                        return b.u_position - a.u_position;
                      }).map((device, idx) => {
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
                                      <span className="text-xs text-blue-400 truncate max-w-[120px]">{doc.original_name}</span>
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
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
{/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-88 border border-gray-100" style={{ width: '380px' }}>
            {/* 아이콘 + 제목 */}
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                style={{ backgroundColor: '#FEE2E2' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#C62828" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 11v4M14 11v4" stroke="#C62828" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">스냅샷을 삭제하시겠습니까?</h3>
              <p className="text-xs text-gray-400">이 작업은 되돌릴 수 없습니다.</p>
            </div>
            {/* 대상 정보 */}
            <div className="rounded-xl px-4 py-3 mb-5" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex gap-3">
                  <span className="text-red-300 w-14 flex-shrink-0">저장명</span>
                  <span className="font-semibold text-red-700 truncate">{deleteTarget.memo || '(저장명 없음)'}</span>
                </div>
                {deleteTarget.saved_by && (
                  <div className="flex gap-3">
                    <span className="text-red-300 w-14 flex-shrink-0">작성자</span>
                    <span className="text-red-600">{deleteTarget.saved_by}</span>
                  </div>
                )}
                <div className="flex gap-3">
                  <span className="text-red-300 w-14 flex-shrink-0">저장 시각</span>
                  <span className="text-red-600">{new Date(deleteTarget.saved_at).toLocaleString('ko-KR')}</span>
                </div>
              </div>
            </div>
            {/* 동의 체크박스 */}
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
                    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className="text-xs text-gray-500">위 내용을 확인했으며, 삭제에 동의합니다.</span>
            </label>
            {/* 버튼 */}
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
{/* 삭제 완료 토스트 */}
      {deleteToast && (
        <div className="fixed z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-medium"
          style={{ top: '68px', right: '24px', backgroundColor: '#7F1D1D', minWidth: '280px', maxWidth: '360px' }}>
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: '#F87171', color: 'white' }}>✕</div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold">스냅샷이 삭제되었습니다.</span>
            <span className="text-xs font-normal truncate" style={{ opacity: 0.7 }}>{deleteToast}</span>
          </div>
        </div>
      )}
{/* 툴팁 */}
      {tooltip && (
        <div className="fixed bg-white rounded-xl shadow-2xl p-3 text-xs pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translateY(-50%)', minWidth: '200px', maxWidth: '280px', zIndex: 99999, border: '1px solid #f3f4f6' }}>
          <div className="font-bold mb-2 text-sm" style={{ color: '#003DA5' }}>{tooltip.slot.name}</div>
          <div className="flex flex-col gap-1 text-gray-600">
            {tooltip.slot.manufacturer && <div className="flex gap-2"><span className="text-gray-400 w-16">제조사</span><span>{tooltip.slot.manufacturer}</span></div>}
            {tooltip.slot.ip_address && <div className="flex gap-2"><span className="text-gray-400 w-16">IP</span><span className="font-mono">{tooltip.slot.ip_address}</span></div>}
            {tooltip.slot.serial && <div className="flex gap-2"><span className="text-gray-400 w-16">시리얼</span><span className="font-mono">{tooltip.slot.serial}</span></div>}
            {tooltip.slot.introduced_date && <div className="flex gap-2"><span className="text-gray-400 w-16">도입일</span><span>{tooltip.slot.introduced_date}</span></div>}
            {tooltip.slot.maintenance_company && <div className="flex gap-2"><span className="text-gray-400 w-16">유지보수</span><span>{tooltip.slot.maintenance_company}</span></div>}
            <div className="flex gap-2 mt-1 pt-1 border-t border-gray-100">
              <span className="text-gray-400 w-16">위치</span>
              <span>{tooltip.slot.u_position}U ({tooltip.slot.size}U)</span>
            </div>
            {tooltip.slot.device_type === 'VM서버' && (() => {
              const slotVMs = (selected?.data?.vms || []).filter(v => v.device_id === tooltip.slot.id);
              if (slotVMs.length === 0) return null;
              return (
                <div className="mt-1 pt-1 border-t border-gray-100">
                  <div className="text-gray-400 mb-1">VM ({slotVMs.length})</div>
                  {slotVMs.map(vm => (
                    <div key={vm.id} className="flex flex-col mb-1 px-2 py-1 rounded-lg" style={{ backgroundColor: '#F3E5F5' }}>
                      <span className="font-medium text-xs" style={{ color: '#6A1B9A' }}>{vm.name}</span>
                      {vm.ip_address && <div className="flex gap-1 text-xs"><span className="text-gray-400">IP</span><span className="font-mono">{vm.ip_address}</span></div>}
                      {vm.host_nm && <div className="flex gap-1 text-xs"><span className="text-gray-400">HOST</span><span>{vm.host_nm}</span></div>}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}

export default SnapshotPage;