import React, { useEffect, useState } from 'react';
import { getDevices, deleteDevice } from '../api/devices';
import { useNavigate } from 'react-router-dom';

function DeviceList() {
  const [devices, setDevices] = useState([]);
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

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">🖥️ DCIM 장비 관리</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/devices/new')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              + 장비 추가
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
            >
              🗂️ 랙 실장도
            </button>
          </div>
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-800 text-white">
              <tr>
                {['ID', '장비명', '제조사', '시리얼', 'U위치', '도입일', '유지보수 업체', '랙 번호', '관리'].map((h) => (
                  <th key={h} className="px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {devices.map((device, idx) => (
                <tr key={device.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-gray-500">{device.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{device.name}</td>
                  <td className="px-4 py-3 text-gray-600">{device.manufacturer}</td>
                  <td className="px-4 py-3 text-gray-600">{device.serial}</td>
                  <td className="px-4 py-3 text-gray-600">{device.u_position}U</td>
                  <td className="px-4 py-3 text-gray-600">{device.introduced_date}</td>
                  <td className="px-4 py-3 text-gray-600">{device.maintenance_company}</td>
                  <td className="px-4 py-3 text-gray-600">RACK #{device.rack_id}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/devices/${device.id}/edit`)}
                      className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500 transition mr-2"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(device.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {devices.length === 0 && (
            <div className="text-center py-12 text-gray-400">등록된 장비가 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeviceList;