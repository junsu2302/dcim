import React, { useEffect, useState } from 'react';
import { getDevices } from '../api/devices';
import { useNavigate, useLocation } from 'react-router-dom';

function DeviceList() {
  const [devices, setDevices] = useState([]);
  const [search, setSearch] = useState('');
  const [filterSite, setFilterSite] = useState('전체');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    const res = await getDevices();
    setDevices(res.data);
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
  ];

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

      {/* 통계 카드 */}
      <div className="px-8 py-6 border-b" style={{ backgroundColor: '#fff' }}>
        <div className="max-w-7xl mx-auto">
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

      <div className="max-w-7xl mx-auto px-8 py-6">
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
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#003DA5' }}>
                {['ID', '구분', '장비명', '제조사', '시리얼', 'U위치', 'U사이즈', '도입일', '유지보수 업체', '사이트', '랙번호'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-white font-medium">{h}</th>
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
                  <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor:
                        device.device_type === '보안' ? '#C62828' :
                        device.device_type === '네트워크' ? '#1565C0' :
                        device.device_type === '서버' ? '#2E7D32' : '#6D4C41'
                      }}>
                      {device.device_type || '기타'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold" style={{ color: '#003DA5' }}>{device.name}</td>
                  <td className="px-4 py-3 text-gray-600">{device.manufacturer}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{device.serial}</td>
                  <td className="px-4 py-3 text-gray-600">{device.u_position}U</td>
                  <td className="px-4 py-3 text-gray-600">{device.u_size}U</td>
                  <td className="px-4 py-3 text-gray-600">{device.introduced_date}</td>
                  <td className="px-4 py-3 text-gray-600">{device.maintenance_company}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: device.site === '본사' ? '#E8EEFF' : '#FFF3E0',
                        color: device.site === '본사' ? '#003DA5' : '#E65100'
                      }}>
                      {device.site}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">RACK #{device.rack_id}</td>
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