import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createDevice, getDevice, updateDevice } from '../api/devices';
import { getRacks } from '../api/racks';

const SITES = ['본사', '하남IDC'];

function DeviceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: '',
    manufacturer: '',
    serial: '',
    u_position: '',
    u_size: 1,
    introduced_date: '',
    maintenance_company: '',
    rack_id: '',
    site: '본사',
  });

  const [allRacks, setAllRacks] = useState([]);
  const [filteredRacks, setFilteredRacks] = useState([]);

  useEffect(() => {
    getRacks().then((res) => setAllRacks(res.data));
    if (isEdit) {
      getDevice(id).then((res) => setForm(res.data));
    }
  }, [id]);

  useEffect(() => {
    const racks = allRacks.filter((r) => r.site === form.site);
    setFilteredRacks(racks);
    if (!isEdit) setForm((prev) => ({ ...prev, rack_id: '' }));
  }, [form.site, allRacks]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.name) return alert('장비명을 입력해주세요.');
    if (!form.rack_id) return alert('랙을 선택해주세요.');
    if (isEdit) {
      await updateDevice(id, form);
    } else {
      await createDevice(form);
    }
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {isEdit ? '✏️ 장비 수정' : '➕ 장비 추가'}
        </h2>

        <div className="flex flex-col gap-4">

          {/* 장비명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              장비명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text" name="name" value={form.name} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 제조사 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제조사</label>
            <input
              type="text" name="manufacturer" value={form.manufacturer} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 시리얼 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시리얼</label>
            <input
              type="text" name="serial" value={form.serial} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* U위치 / U사이즈 */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">U위치 (시작)</label>
              <input
                type="number" name="u_position" value={form.u_position} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">U사이즈</label>
              <select
                name="u_size" value={form.u_size} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 4, 8].map((u) => (
                  <option key={u} value={u}>{u}U</option>
                ))}
              </select>
            </div>
          </div>

          {/* 도입일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">도입일</label>
            <input
              type="date" name="introduced_date" value={form.introduced_date} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 유지보수 업체 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">유지보수 업체</label>
            <input
              type="text" name="maintenance_company" value={form.maintenance_company} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Site 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              사이트 <span className="text-red-500">*</span>
            </label>
            <select
              name="site" value={form.site} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SITES.map((site) => (
                <option key={site} value={site}>{site}</option>
              ))}
            </select>
          </div>

          {/* 랙 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              랙 선택 <span className="text-red-500">*</span>
            </label>
            <select
              name="rack_id" value={form.rack_id} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">랙을 선택해주세요</option>
              {filteredRacks.map((rack) => (
                <option key={rack.id} value={rack.id}>
                  RACK #{rack.rack_number}
                </option>
              ))}
            </select>
            {filteredRacks.length === 0 && (
              <p className="text-xs text-red-400 mt-1">
                해당 사이트에 등록된 랙이 없습니다. 먼저 랙을 추가해주세요.
              </p>
            )}
          </div>

        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {isEdit ? '수정 완료' : '추가 완료'}
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeviceForm;