import React, { useEffect, useState } from 'react';
import { getDevices } from '../api/devices';
import { useNavigate, useLocation } from 'react-router-dom';
import { createSnapshot } from '../api/snapshots';
import { getDocuments, getDownloadUrl } from '../api/documents';

function DeviceList() {
  const [devices, setDevices] = useState([]);
  const [search, setSearch] = useState('');
  const [filterSite, setFilterSite] = useState('전체');
  const [deviceDocs, setDeviceDocs] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    const res = await getDevices();
    setDevices(res.data);
    const docsMap = {};
    await Promise.all(res.data.map(async (d) => {
      const docRes = await getDocuments(d.id);
      docsMap[d.id] = docRes.data;
    }));
    setDeviceDocs(docsMap);
  };

  const sites = ['전체', ...new Set(devices.map(d => d.site).filter(Boolean))];

  const filtered = devices
    .filter((d) => {
      const matchSite = filterSite === '전체' || d.site === filterSite;
      const matchSearch =
        !search ||
        d.name?.includes(search) ||
        d.manufacturer?.includes(search) ||
        d.serial?.includes(search) ||
        d.maintenance_company?.includes(search);
      return matchSite && matchSearch;
    })
    .sort((a, b) => {
      if (a.site !== b.site) return a.site.localeCompare(b.site);
      if (a.rack_id !== b.rack_id) return a.rack_id - b.rack_id;
      return a.u_position - b.u_position;
    });

  const NAV_TABS = [
    { label: '랙 실장도', path: '/' },
    { label: '장비 리스트', path: '/devices' },
    { label: '이력 관리', path: '/snapshots' },
  ];
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [snapshotMemo, setSnapshotMemo] = useState('');

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6FA' }}>
      {/* 헤더 */}
      <div className="text-white px-8 py-4 flex justify-between items-center shadow-lg" style={{ backgroundColor: '#003DA5' }}>
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition" onClick={() => navigate('/')}>
          <img src={require('../assets/header_logo.png')} alt="IBK시스템" style={{ height: '32px' }} />
          <div className="w-px h-6 bg-white opacity-30"></div>
          <h1 className="text-lg font-bold tracking-wide text-white">IT 인프라 관리 시스템</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSnapshotModal(true)}
            className="text-sm font-medium px-4 py-1.5 rounded-lg transition hover:opacity-90"
            style={{ backgroundColor: '#FFB81C', color: 'white' }}
          >
            📸 스냅샷 저장
          </button>
          <div className="flex items-center p-1 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
            {NAV_TABS.map((tab) => (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
                style={{
                  backgroundColor: location.pathname === tab.path ? 'white' : 'transparent',
                  color: location.pathname === tab.path ? '#003DA5' : 'rgba(255,255,255,0.7)',
                  minWidth: '80px',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
{/* 스냅샷 저장 모달 */}
      {showSnapshotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-96">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#FFB81C' }}></div>
              <h3 className="text-lg font-bold" style={{ color: '#003DA5' }}>스냅샷 저장</h3>
            </div>
            <p className="text-xs text-gray-400 mb-4 ml-3">현재 전체 랙/장비 현황을 저장합니다.</p>
            <label className="text-sm font-medium text-gray-600 mb-1 block">메모 (선택)</label>
            <input
              type="text"
              value={snapshotMemo}
              onChange={(e) => setSnapshotMemo(e.target.value)}
              placeholder="예: 2026년 4월 장비 추가 후"
              className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2"
            />
            <div className="flex gap-2 mt-5">
              <button
                onClick={async () => {
                  await createSnapshot(snapshotMemo);
                  setShowSnapshotModal(false);
                  setSnapshotMemo('');
                }}
                className="flex-1 text-white py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90"
                style={{ backgroundColor: '#003DA5' }}
              >
                저장
              </button>
              <button
                onClick={() => { setShowSnapshotModal(false); setSnapshotMemo(''); }}
                className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 통계 카드 */}
      <div className="px-8 py-6 border-b" style={{ backgroundColor: '#fff' }}>
        <div>
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: '전체 장비', value: devices.length, color: '#003DA5', icon: '🖥️' },
              { label: '보안', value: devices.filter(d => d.device_type === '보안').length, color: '#C62828', icon: '🔒' },
              { label: '네트워크', value: devices.filter(d => d.device_type === '네트워크').length, color: '#1565C0', icon: '🌐' },
              { label: '서버', value: devices.filter(d => d.device_type === '서버').length, color: '#2E7D32', icon: '⚙️' },
              { label: '기타', value: devices.filter(d => !d.device_type || d.device_type === '기타').length, color: '#6D4C41', icon: '📦' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl p-4 flex items-center gap-4"
                style={{ backgroundColor: stat.color + '10', border: `1px solid ${stat.color}22` }}>
                <div className="text-3xl w-12 h-12 rounded-xl flex items-center justify-center"
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
      </div>

      <div className="px-32 py-6">
        {/* 검색 & 필터 */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex gap-4 items-center">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="장비명, 제조사, 시리얼, 유지보수 업체 검색..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
            />
          </div>
          <div className="flex gap-2">
            {sites.map(site => (
              <button
                key={site}
                onClick={() => setFilterSite(site)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition"
                style={{
                  backgroundColor: filterSite === site ? '#003DA5' : '#F4F6FA',
                  color: filterSite === site ? 'white' : '#555',
                }}
              >
                {site}
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-400">총 {filtered.length}개</div>
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-xl shadow-sm" style={{ overflowX: 'auto' }}>
          <table className="text-sm" style={{ minWidth: '1400px', width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ backgroundColor: '#003DA5' }}>
              {[
                { label: 'ID', width: '4%' },
                { label: '구분', width: '5%' },
                { label: '장비명', width: '10%' },
                { label: '제조사', width: '7%' },
                { label: '제품명', width: '7%' },
                { label: 'IP', width: '8%' },
                { label: '시리얼', width: '9%' },
                { label: 'U위치', width: '5%' },
                { label: 'U사이즈', width: '6%' },
                { label: '도입일', width: '8%' },
                { label: '유지보수 업체', width: '9%' },
                { label: '사이트', width: '6%' },
                { label: '랙번호', width: '7%' },
                { label: '문서', width: '9%' },
              ].map((h) => (
                <th key={h.label} className="px-4 py-3 text-left text-white font-medium text-sm whitespace-nowrap" style={{ width: h.width }}>{h.label}</th>
              ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((device, idx) => (
                <tr
                  key={device.id}
                  className="border-b border-gray-100 hover:bg-blue-50 transition cursor-pointer"
                  style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#FAFBFF' }}
                >
                  <td className="px-4 py-5 text-gray-400 text-sm whitespace-nowrap">{idx + 1}</td>
                  <td className="px-4 py-5 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor:
                        device.device_type === '보안' ? '#C62828' :
                        device.device_type === '네트워크' ? '#1565C0' :
                        device.device_type === '서버' ? '#2E7D32' : '#6D4C41'
                      }}>
                      {device.device_type || '기타'}
                    </span>
                  </td>
                  <td className="px-4 py-5 font-semibold text-sm whitespace-nowrap" style={{ color: '#003DA5' }}>{device.name}</td>
                  <td className="px-4 py-5 text-gray-600 text-sm whitespace-nowrap">{device.manufacturer}</td>
                  <td className="px-4 py-5 text-gray-600 text-sm whitespace-nowrap">{device.product_name}</td>
                  <td className="px-4 py-5 text-gray-500 font-mono text-sm whitespace-nowrap">{device.ip_address}</td>
                  <td className="px-4 py-5 text-gray-500 font-mono text-sm whitespace-nowrap">{device.serial}</td>
                  <td className="px-4 py-5 text-gray-600 text-sm whitespace-nowrap">{device.u_position}U</td>
                  <td className="px-4 py-5 text-gray-600 text-sm whitespace-nowrap">{device.u_size}U</td>
                  <td className="px-4 py-5 text-gray-600 text-sm whitespace-nowrap">{device.introduced_date}</td>
                  <td className="px-4 py-5 text-gray-600 text-sm whitespace-nowrap">{device.maintenance_company}</td>
                  <td className="px-4 py-5 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: device.site === '본사' ? '#E8EEFF' : '#FFF3E0',
                        color: device.site === '본사' ? '#003DA5' : '#E65100'
                      }}>
                      {device.site}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-gray-600 text-sm whitespace-nowrap">RACK #{device.rack_id}</td>
                  <td className="px-4 py-5">
                    {(deviceDocs[device.id] || []).length === 0 ? (
                      <span className="text-gray-300 text-xs">-</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {(deviceDocs[device.id] || []).map(doc => (
                          <a
                            key={doc.id}
                            href={getDownloadUrl(doc.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 hover:opacity-70 transition"
                          >
                            <span className="text-xs" style={{ color: '#003DA5' }}>💾</span>
                            <span className="text-xs text-blue-400 truncate max-w-[120px]">{doc.original_name}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">📭</div>
              <div>등록된 장비가 없습니다.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeviceList;