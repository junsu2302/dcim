import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createDevice, getDevice, updateDevice } from '../api/devices';
import { getRacks } from '../api/racks';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
const SITES = ['본사', '하남IDC'];

function DeviceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: '',
    manufacturer: '',
    serial: '',
    ip_address: '',
    u_position: '',
    u_size: 1,
    introduced_date: '',
    maintenance_company: '',
    maintenance_expiry_date: '',
    rack_id: '',
    site: '본사',
    device_type: '기타',
    product_name: '',
  });

  const [allRacks, setAllRacks] = useState([]);
  const [filteredRacks, setFilteredRacks] = useState([]);
  const [ipWarning, setIpWarning] = useState('');
  const [ipChecking, setIpChecking] = useState(false);

  useEffect(() => {
    getRacks().then((res) => setAllRacks(res.data));
    if (isEdit) {
      getDevice(id).then((res) => setForm(res.data));
    }
  }, [id, isEdit]);

  useEffect(() => {
    const racks = allRacks.filter((r) => r.site === form.site);
    setFilteredRacks(racks);
    if (!isEdit) {
      setForm((prev) => ({ ...prev, rack_id: '' }));
    }
  }, [form.site, allRacks, isEdit]);

  const checkIpDuplicate = useCallback(async (ip) => {
    if (!ip || !ip.trim()) { setIpWarning(''); return; }
    setIpChecking(true);
    try {
      const params = { ip };
      if (isEdit) params.exclude_id = id;
      const res = await axios.get(`${API}/devices/check-ip`, { params });
      if (res.data.duplicate) {
        setIpWarning(`⚠ 이미 사용 중인 IP입니다 (${res.data.device_name})`);
      } else {
        setIpWarning('');
      }
    } catch {
      setIpWarning('');
    } finally {
      setIpChecking(false);
    }
  }, [isEdit, id]);

  useEffect(() => {
    const timer = setTimeout(() => checkIpDuplicate(form.ip_address), 500);
    return () => clearTimeout(timer);
  }, [form.ip_address, checkIpDuplicate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.name) return alert('장비명을 입력해주세요.');
    if (!form.rack_id) return alert('랙을 선택해주세요.');
    if (ipWarning) return alert('IP 주소 중복을 확인해주세요.');

    const selectedRack = allRacks.find(r => String(r.id) === String(form.rack_id));
    if (selectedRack) {
      const uPos = Number(form.u_position);
      const uSize = Number(form.u_size);
      const totalU = Number(selectedRack.total_u || 42);
      if (uPos < 1) return alert('U위치는 1 이상이어야 합니다.');
      if (uPos + uSize - 1 > totalU) {
        return alert(
          `해당 랙은 최대 ${totalU}U까지만 수용 가능합니다.\n` +
          `현재 설정(위치:${uPos}, 크기:${uSize})은 ${uPos + uSize - 1}U까지 차지합니다.`
        );
      }
    }

    try {
      if (isEdit) {
        await updateDevice(id, form, user?.username);
      } else {
        await createDevice(form, user?.username);
      }
      navigate('/rack');
    } catch (err) {
      alert(err.response?.data?.detail || '저장 중 오류가 발생했습니다.');
    }
  };

  const expiryDaysLeft = () => {
    if (!form.maintenance_expiry_date) return null;
    const diff = Math.ceil((new Date(form.maintenance_expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };
  const days = expiryDaysLeft();

  const Field = ({ label, required, children }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition";

  return (
    <div className="min-h-screen flex items-start justify-center py-10 px-4" style={{ backgroundColor: '#F4F6FA' }}>
      <div className="w-full max-w-2xl bg-white rounded-2xl p-8" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div className="flex items-center gap-3 mb-7">
          <div className="w-1 h-6 rounded-full" style={{ backgroundColor: '#003DA5' }} />
          <h2 className="text-lg font-bold text-gray-800">
            {isEdit ? '장비 수정' : '장비 추가'}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4">

          <Field label="장비명" required>
            <input type="text" name="name" value={form.name || ''} onChange={handleChange} className={inputClass} />
          </Field>

          <Field label="장비 구분">
            <select name="device_type" value={form.device_type || '기타'} onChange={handleChange} className={inputClass}>
              {['보안', '네트워크', '서버', 'VM서버', '기타'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>

          <Field label="제조사">
            <input type="text" name="manufacturer" value={form.manufacturer || ''} onChange={handleChange} className={inputClass} />
          </Field>

          <Field label="모델명">
            <input type="text" name="product_name" value={form.product_name || ''} onChange={handleChange} className={inputClass} />
          </Field>

          <Field label="시리얼">
            <input type="text" name="serial" value={form.serial || ''} onChange={handleChange} className={inputClass} />
          </Field>

          <Field label="IP 주소">
            <input type="text" name="ip_address" value={form.ip_address || ''} onChange={handleChange}
              className={inputClass + (ipWarning ? ' border-orange-400' : '')}
              placeholder="예: 192.168.1.100" />
            {ipChecking && <p className="text-xs text-gray-400 mt-1">확인 중...</p>}
            {ipWarning && <p className="text-xs mt-1" style={{ color: '#F59E0B' }}>{ipWarning}</p>}
          </Field>

          <Field label="사이트" required>
            <select name="site" value={form.site} onChange={handleChange} className={inputClass}>
              {SITES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>

          <Field label="랙 선택" required>
            <select name="rack_id" value={form.rack_id} onChange={handleChange} className={inputClass}>
              <option value="">랙을 선택해주세요</option>
              {filteredRacks.map(r => (
                <option key={r.id} value={r.id}>RACK #{r.rack_number}</option>
              ))}
            </select>
            {filteredRacks.length === 0 && (
              <p className="text-xs text-red-400 mt-1">해당 사이트에 등록된 랙이 없습니다.</p>
            )}
          </Field>

          <Field label="U위치 (시작)">
            <input type="number" name="u_position" value={form.u_position || ''} onChange={handleChange} className={inputClass} />
          </Field>

          <Field label="U사이즈">
            <select name="u_size" value={form.u_size} onChange={handleChange} className={inputClass}>
              {[1, 2, 4, 8].map(u => <option key={u} value={u}>{u}U</option>)}
            </select>
          </Field>

          <Field label="도입일">
            <input type="date" name="introduced_date" value={form.introduced_date || ''} onChange={handleChange} className={inputClass} />
          </Field>

          <Field label="유지보수 업체">
            <input type="text" name="maintenance_company" value={form.maintenance_company || ''} onChange={handleChange} className={inputClass} />
          </Field>

          <div className="col-span-2">
            <Field label="유지보수 만료일">
              <div className="flex items-center gap-3">
                <input type="date" name="maintenance_expiry_date"
                  value={form.maintenance_expiry_date || ''} onChange={handleChange} className={inputClass} />
                {days !== null && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: days < 0 ? '#FECACA' : days <= 7 ? '#FEF3C7' : days <= 30 ? '#FEF9C3' : '#DCFCE7',
                      color: days < 0 ? '#991B1B' : days <= 7 ? '#92400E' : days <= 30 ? '#713F12' : '#166534',
                    }}>
                    {days < 0 ? `만료 ${Math.abs(days)}일 초과` : days === 0 ? '오늘 만료' : `D-${days}`}
                  </span>
                )}
              </div>
            </Field>
          </div>

        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={handleSubmit}
            className="flex-1 text-white py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90"
            style={{ backgroundColor: '#003DA5' }}>
            {isEdit ? '수정 완료' : '추가 완료'}
          </button>
          <button onClick={() => navigate('/rack')}
            className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeviceForm;
