import React, { useEffect, useState } from 'react';
import { getDevices, deleteDevice } from '../api/devices';
import { useNavigate } from 'react-router-dom';

function DeviceList() {
  const [devices, setDevices] = useState([]);
  const [search, setSearch] = useState('');
  const [filterSite, setFilterSite] = useState('전체');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    const res = await getDevices();
    setDevices(res.data);
  };

  const handleDelete = async (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      await deleteDevice(id);
      fetchDevices();
    }
  };

  const sites = ['전체', ...new Set(devices.map(d => d.site).filter(Boolean))];

  const filtered = devices.filter(d => {
    const matchSite = filterSite === '전체' || d.site === filterSite;
    const matchSearch =
      !search ||
      d.name?.includes(search) ||
      d.manufacturer?.includes(search) ||
      d.serial?.includes(search) ||
      d.maintenance_company?.includes(search);

    return matchSite && matchSearch;
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6FA' }}>
      
      {/* 헤더 */}
      <div
        className="text-white px-8 py-4 flex justify-between items-center shadow-lg"
        style={{ backgroundColor: '#003DA5' }}
      >
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
          onClick={() => navigate('/')}
        >
          <img
            src={require('../assets/header_logo.png')}
            alt="IBK시스템"
            style={{ height: '32px' }}
          />
          <div className="w-px h-6 bg-white opacity-30"></div>
          <h1 className="text-lg font-bold tracking-wide text-white">DCIM</h1>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate('/')}
            className="text-white px-4 py-2 rounded-lg text-sm transition hover:opacity-80"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            🗂️ 랙 실장도
          </button>
        </div>
      </div>

      {/* 서브 헤더 */}
      <div className="px-8 py-5 border-b" style={{ backgroundColor: '#fff' }}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#003DA5' }}>
              장비 관리
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              총 {filtered.length}개 장비
            </p>
          </div>

          <button
            onClick={() => navigate('/devices/new')}
            className="text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow hover:opacity-90 transition"
            style={{ backgroundColor: '#003DA5' }}
          >
            + 장비 추가
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-6">
        
        {/* 검색 & 필터 */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex gap-4 items-center">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="장비명, 제조사, 시리얼, 유지보수 업체 검색..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#003DA5' }}
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
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            
            <thead>
              <tr style={{ backgroundColor: '#003DA5' }}>
                {[
                  'ID', '장비명', '제조사', '시리얼',
                  'U위치', 'U사이즈', '도입일',
                  '유지보수 업체', '사이트', '랙', '관리'
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-white font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.map((device, idx) => (
                <tr
                  key={device.id}
                  className="border-b border-gray-100 hover:bg-blue-50 transition"
                  style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#FAFBFF' }}
                >
                  <td className="px-4 py-3 text-gray-400 text-xs">{device.id}</td>
                  <td className="px-4 py-3 font-semibold" style={{ color: '#003DA5' }}>
                    {device.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{device.manufacturer}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                    {device.serial}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{device.u_position}U</td>
                  <td className="px-4 py-3 text-gray-600">{device.u_size}U</td>
                  <td className="px-4 py-3 text-gray-600">{device.introduced_date}</td>
                  <td className="px-4 py-3 text-gray-600">{device.maintenance_company}</td>

                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: device.site === '본사' ? '#E8EEFF' : '#FFF3E0',
                        color: device.site === '본사' ? '#003DA5' : '#E65100'
                      }}
                    >
                      {device.site}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    RACK #{device.rack_id}
                  </td>

                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/devices/${device.id}/edit`)}
                      className="px-3 py-1 rounded text-xs font-medium mr-1 hover:opacity-80 transition"
                      style={{ backgroundColor: '#FFB81C', color: 'white' }}
                    >
                      수정
                    </button>

                    <button
                      onClick={() => handleDelete(device.id)}
                      className="px-3 py-1 rounded text-xs font-medium hover:opacity-80 transition"
                      style={{ backgroundColor: '#D32F2F', color: 'white' }}
                    >
                      삭제
                    </button>
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