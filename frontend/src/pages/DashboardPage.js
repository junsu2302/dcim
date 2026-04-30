import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDevices } from '../api/devices';
import { getRacks } from '../api/racks';

const NAV_TABS = [
  { label: '대시보드', path: '/' },
  { label: '랙 실장도', path: '/rack' },
  { label: '장비 리스트', path: '/devices' },
  { label: '이력 관리', path: '/snapshots' },
];

const DEVICE_TYPES = ['보안', '네트워크', '서버', '기타'];
const TYPE_COLORS = {
  '보안': { bg: '#FEE2E2', text: '#C62828', bar: '#C62828' },
  '네트워크': { bg: '#DBEAFE', text: '#1565C0', bar: '#1565C0' },
  '서버': { bg: '#DCFCE7', text: '#2E7D32', bar: '#2E7D32' },
  '기타': { bg: '#F5F0EE', text: '#6D4C41', bar: '#6D4C41' },
};
const SITE_COLORS = {
  '본사': { bg: '#EEF2FF', text: '#003DA5', bar: '#003DA5' },
  '하남IDC': { bg: '#FFF7ED', text: '#C2410C', bar: '#EA580C' },
};

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm border border-gray-100 hover:shadow-md transition-all">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ backgroundColor: color + '18' }}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-800">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function BarChart({ data, total }) {
  return (
    <div className="flex flex-col gap-3">
      {data.map(item => (
        <div key={item.label} className="flex items-center gap-3">
          <div className="w-16 text-xs text-gray-500 flex-shrink-0 text-right">{item.label}</div>
          <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: total > 0 ? `${(item.value / total) * 100}%` : '0%',
                backgroundColor: item.color,
                minWidth: item.value > 0 ? '8px' : '0',
              }}
            />
          </div>
          <div className="w-8 text-xs font-semibold text-gray-700 flex-shrink-0">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function DashboardPage() {
  const [devices, setDevices] = useState([]);
  const [racks, setRacks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getDevices(), getRacks()]).then(([devRes, rackRes]) => {
      setDevices(devRes.data);
      setRacks(rackRes.data);
    });
  }, []);

  const sites = ['본사', '하남IDC'];

  const totalU = racks.reduce((a, r) => a + (r.total_u || 42), 0);
  const usedU = devices.reduce((a, d) => a + (d.u_size || 1), 0);
  const usageRate = totalU > 0 ? Math.round((usedU / totalU) * 100) : 0;

  const typeData = DEVICE_TYPES.map(t => ({
    label: t,
    value: t === '기타'
      ? devices.filter(d => !d.device_type || d.device_type === '기타').length
      : devices.filter(d => d.device_type === t).length,
    color: TYPE_COLORS[t].bar,
  }));

  const siteData = sites.map(s => ({
    label: s,
    value: devices.filter(d => d.site === s).length,
    color: SITE_COLORS[s].bar,
  }));

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
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

      <div className="px-8 py-6 max-w-7xl mx-auto">
        {/* 페이지 타이틀 */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">대시보드</h2>
          <p className="text-sm text-gray-500 mt-1">IT 인프라 전체 현황을 한눈에 확인하세요.</p>
        </div>

        {/* 상단 통계 카드 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard icon="🖥️" label="전체 장비" value={devices.length} color="#003DA5" />
          <StatCard icon="🗄️" label="전체 랙" value={racks.length} color="#6D28D9"
            sub={`본사 ${racks.filter(r => r.site === '본사').length}개 · 하남IDC ${racks.filter(r => r.site === '하남IDC').length}개`} />
          <StatCard icon="📊" label="랙 사용률" value={`${usageRate}%`} color="#0891B2"
            sub={`${usedU}U / ${totalU}U 사용 중`} />
          <StatCard icon="💾" label="여유 공간" value={`${totalU - usedU}U`} color="#059669"
            sub={`전체 ${totalU}U 중 여유`} />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* 장비 구분별 현황 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-700 mb-4">장비 구분별 현황</h3>
            <BarChart data={typeData} total={devices.length} />
            <div className="grid grid-cols-2 gap-2 mt-4">
              {typeData.map(item => (
                <div key={item.label} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ backgroundColor: TYPE_COLORS[item.label].bg }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-medium" style={{ color: TYPE_COLORS[item.label].text }}>{item.label}</span>
                  <span className="text-xs font-bold ml-auto" style={{ color: TYPE_COLORS[item.label].text }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 사이트별 현황 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-700 mb-4">사이트별 현황</h3>
            <BarChart data={siteData} total={devices.length} />
            <div className="flex flex-col gap-2 mt-4">
              {sites.map(site => {
                const siteRacks = racks.filter(r => r.site === site);
                const siteDevices = devices.filter(d => d.site === site);
                const siteTotalU = siteRacks.reduce((a, r) => a + (r.total_u || 42), 0);
                const siteUsedU = siteDevices.reduce((a, d) => a + (d.u_size || 1), 0);
                return (
                  <div key={site} className="px-3 py-2.5 rounded-xl"
                    style={{ backgroundColor: SITE_COLORS[site].bg }}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold" style={{ color: SITE_COLORS[site].text }}>{site}</span>
                      <span className="text-xs font-bold" style={{ color: SITE_COLORS[site].text }}>
                        {siteDevices.length}대 · {siteRacks.length}랙
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white bg-opacity-60 rounded-full overflow-hidden">
                      <div className="h-full rounded-full"
                        style={{
                          width: siteTotalU > 0 ? `${Math.round((siteUsedU / siteTotalU) * 100)}%` : '0%',
                          backgroundColor: SITE_COLORS[site].bar,
                        }} />
                    </div>
                    <div className="text-xs mt-1" style={{ color: SITE_COLORS[site].text, opacity: 0.7 }}>
                      {siteUsedU}U / {siteTotalU}U 사용
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 랙별 사용률 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-700 mb-4">랙별 사용률</h3>
            <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: '260px' }}>
              {racks.map(rack => {
                const rackDevices = devices.filter(d => d.rack_id === rack.id);
                const usedU = rackDevices.reduce((a, d) => a + (d.u_size || 1), 0);
                const totalU = rack.total_u || 42;
                const rate = Math.round((usedU / totalU) * 100);
                return (
                  <div key={rack.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-xl px-2 py-1.5 transition"
                    onClick={() => navigate('/rack')}>
                    <div className="flex-shrink-0 text-xs text-gray-500 w-20">
                      <div className="font-semibold text-gray-700">RACK #{rack.rack_number}</div>
                      <div className="text-gray-400">{rack.site}</div>
                    </div>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{
                          width: `${rate}%`,
                          backgroundColor: rate > 80 ? '#C62828' : rate > 50 ? '#F59E0B' : '#003DA5',
                        }} />
                    </div>
                    <div className="text-xs font-semibold text-gray-600 w-8 flex-shrink-0">{rate}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 최근 장비 목록 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-700">전체 장비 현황</h3>
            <button onClick={() => navigate('/devices')}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition hover:opacity-90"
              style={{ backgroundColor: '#EEF2FF', color: '#003DA5' }}>
              전체 보기 →
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC' }}>
                {['구분', '장비명', '제조사', '사이트', '랙번호', 'U위치', '도입일', '유지보수 업체'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-gray-500 font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {devices.slice(0, 10).map((device, idx) => {
                const rack = racks.find(r => r.id === device.rack_id);
                return (
                  <tr key={device.id} className="border-t border-gray-50 hover:bg-blue-50 transition cursor-pointer"
                    onClick={() => navigate('/devices')}>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor:
                          device.device_type === '보안' ? '#C62828' :
                          device.device_type === '네트워크' ? '#1565C0' :
                          device.device_type === '서버' ? '#2E7D32' : '#6D4C41' }}>
                        {device.device_type || '기타'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-sm" style={{ color: '#003DA5' }}>{device.name}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{device.manufacturer}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: device.site === '본사' ? '#EEF2FF' : '#FFF7ED',
                          color: device.site === '본사' ? '#003DA5' : '#C2410C',
                        }}>
                        {device.site}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{rack ? `RACK #${rack.rack_number}` : '-'}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{device.u_position}U</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{device.introduced_date}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{device.maintenance_company}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;