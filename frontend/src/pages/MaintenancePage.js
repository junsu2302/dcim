import React, { useEffect, useState, useCallback } from 'react';
import { getMaintenance, createMaintenance, updateMaintenance, deleteMaintenance } from '../api/maintenance';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/AppHeader';

const MONTH_ORDER = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8];
const SITES = ['본사', '하남IDC'];
const CATEGORIES = ['보안', '네트워크', '서버', 'VM서버', '기타'];

const EMPTY_FORM = {
  site: '본사',
  category: '',
  item_name: '',
  system_name: '',
  contract_start: '',
  contract_end: '',
  quantity: '',
  inspection_count: '',
  company: '',
  manager_name: '',
  manager_phone: '',
  inspection_schedule: '{}',
  notes: '',
};

function parseSchedule(raw) {
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
}

function ScheduleDots({ schedule }) {
  const parsed = parseSchedule(schedule);
  const activeMonths = MONTH_ORDER.filter(m => String(m) in parsed);
  if (activeMonths.length === 0) {
    return <span className="text-xs text-gray-300">미설정</span>;
  }
  return (
    <div className="flex gap-0.5 flex-wrap">
      {MONTH_ORDER.map(month => {
        const key = String(month);
        const date = parsed[key];
        const active = key in parsed;
        return (
          <div
            key={month}
            title={active ? (date ? `${month}월 ${date}일` : `${month}월`) : undefined}
            className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold transition"
            style={{
              backgroundColor: active ? '#DBEAFE' : '#F1F5F9',
              color: active ? '#1D4ED8' : '#CBD5E1',
            }}
          >
            {month}
          </div>
        );
      })}
    </div>
  );
}

function SchedulePopup({ item, anchorRect, onSave, onClose }) {
  const original = parseSchedule(item.inspection_schedule);
  const [local, setLocal] = useState(() => parseSchedule(item.inspection_schedule));
  const [saving, setSaving] = useState(false);

  const isDirty = JSON.stringify(local) !== JSON.stringify(original);

  const toggle = (month) => {
    const key = String(month);
    setLocal(prev => {
      const next = { ...prev };
      if (key in next) { delete next[key]; } else { next[key] = ''; }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(item.id, JSON.stringify(local));
    setSaving(false);
    onClose();
  };

  const handleCancel = () => {
    if (isDirty && !window.confirm('변경사항을 저장하지 않고 닫겠습니까?')) return;
    onClose();
  };

  const popupWidth = 336;
  const popupHeight = 340;
  const margin = 10;
  let top = anchorRect.bottom + 6;
  let left = anchorRect.left;
  if (left + popupWidth > window.innerWidth - margin) left = window.innerWidth - popupWidth - margin;
  if (top + popupHeight > window.innerHeight - margin) top = anchorRect.top - popupHeight - 6;

  const activeCount = Object.keys(local).length;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={handleCancel} />
      <div
        className="fixed z-50 bg-white rounded-2xl border border-gray-100"
        style={{ top, left, width: popupWidth, boxShadow: '0 12px 40px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)' }}
      >
        {/* 헤더 */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-50 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#003DA5" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              <span className="text-sm font-bold" style={{ color: '#003DA5' }}>점검 일정</span>
              {activeCount > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8' }}>
                  {activeCount}개월
                </span>
              )}
              {isDirty && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#FEF9C3', color: '#854D0E' }}>
                  미저장
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-0.5 truncate">{item.item_name}</div>
          </div>
          <button onClick={handleCancel} className="text-gray-300 hover:text-gray-500 transition ml-2 flex-shrink-0 mt-0.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 월 그리드 */}
        <div className="p-4">
          <div className="grid grid-cols-4 gap-2">
            {MONTH_ORDER.map(month => {
              const key = String(month);
              const active = key in local;
              const date = local[key];
              return (
                <div key={month} className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggle(month)}
                    className="w-full h-9 rounded-xl text-xs font-bold transition-all"
                    style={{
                      backgroundColor: active ? '#2563EB' : '#F1F5F9',
                      color: active ? 'white' : '#94A3B8',
                      boxShadow: active ? '0 2px 8px rgba(37,99,235,0.35)' : 'none',
                    }}
                  >
                    {month}월
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    disabled={!active}
                    value={active ? (date || '') : ''}
                    onChange={e => active && setLocal(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={active ? '일' : '—'}
                    className="w-full rounded-lg text-center text-xs py-1 border transition focus:outline-none focus:ring-2 focus:ring-blue-200"
                    style={{
                      borderColor: active ? '#93C5FD' : '#F1F5F9',
                      backgroundColor: active ? '#F8FAFF' : '#F9FAFB',
                      color: active ? '#1D4ED8' : '#CBD5E1',
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="flex-1 py-2 rounded-xl text-xs font-semibold text-white transition"
            style={{
              backgroundColor: isDirty ? '#003DA5' : '#CBD5E1',
              cursor: isDirty ? 'pointer' : 'not-allowed',
            }}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
          >
            취소
          </button>
        </div>
      </div>
    </>
  );
}

function ExpiryBadge({ contractEnd }) {
  if (!contractEnd) return null;
  const diff = Math.ceil((new Date(contractEnd) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>만료</span>;
  if (diff <= 30) return <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>D-{diff}</span>;
  return null;
}

function DeleteModal({ item, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-80">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FEE2E2' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold text-gray-800">유지보수 항목 삭제</div>
            <div className="text-xs text-gray-400">이 작업은 되돌릴 수 없습니다.</div>
          </div>
        </div>
        <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-100 mb-4">
          <span className="text-xs font-semibold text-red-700">{item?.item_name}</span>
          {item?.system_name && <span className="text-xs text-red-400 ml-2">({item.system_name})</span>}
        </div>
        <div className="flex gap-2">
          <button onClick={onConfirm} className="flex-1 text-white py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition" style={{ backgroundColor: '#DC2626' }}>삭제</button>
          <button onClick={onCancel} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">취소</button>
        </div>
      </div>
    </div>
  );
}

function MaintenanceModal({ item, onClose, onSaved }) {
  const [form, setForm] = useState(item ? {
    ...item,
    quantity: item.quantity ?? '',
    inspection_count: item.inspection_count ?? '',
    inspection_schedule: item.inspection_schedule || '{}',
  } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!form.item_name.trim()) return alert('품목을 입력해주세요.');
    setSaving(true);
    const payload = {
      ...form,
      quantity: form.quantity === '' ? null : Number(form.quantity),
    };
    try {
      if (item) {
        await updateMaintenance(item.id, payload);
        onSaved('유지보수 항목이 수정되었습니다.');
      } else {
        await createMaintenance(payload);
        onSaved('유지보수 항목이 추가되었습니다.');
      }
      onClose();
    } catch (e) {
      alert(e.response?.data?.detail || '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition";
  const labelCls = "block text-xs font-semibold text-gray-500 mb-1";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl flex flex-col" style={{ maxHeight: '90vh', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-base font-bold" style={{ color: '#003DA5' }}>
            {item ? '유지보수 항목 수정' : '유지보수 항목 추가'}
          </h3>
          {!item && <p className="text-xs text-gray-400 mt-0.5">점검 일정은 항목 추가 후 표에서 직접 설정할 수 있습니다.</p>}
        </div>
        <div className="overflow-y-auto px-6 py-4 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>사이트</label>
              <select name="site" value={form.site || ''} onChange={handleChange} className={inputCls}>
                <option value="">선택</option>
                {SITES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>구분</label>
              <select name="category" value={form.category || ''} onChange={handleChange} className={inputCls}>
                <option value="">선택</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className={labelCls}>품목 <span className="text-red-500">*</span></label>
              <input type="text" name="item_name" value={form.item_name} onChange={handleChange} className={inputCls} placeholder="품목명" />
            </div>
            <div>
              <label className={labelCls}>시스템명</label>
              <input type="text" name="system_name" value={form.system_name || ''} onChange={handleChange} className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>계약 시작일</label>
              <input type="date" name="contract_start" value={form.contract_start || ''} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>계약 종료일</label>
              <input type="date" name="contract_end" value={form.contract_end || ''} onChange={handleChange} className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>수량</label>
              <input type="number" name="quantity" value={form.quantity} onChange={handleChange} className={inputCls} min="0" />
            </div>
            <div>
              <label className={labelCls}>점검 주기</label>
              <input type="text" name="inspection_count" value={form.inspection_count} onChange={handleChange} className={inputCls} placeholder="예) 월, 분기, 반기" />
            </div>

            <div>
              <label className={labelCls}>유지보수 업체</label>
              <input type="text" name="company" value={form.company || ''} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>담당자명</label>
              <input type="text" name="manager_name" value={form.manager_name || ''} onChange={handleChange} className={inputCls} />
            </div>

            <div className="col-span-2">
              <label className={labelCls}>담당자 연락처</label>
              <input type="text" name="manager_phone" value={form.manager_phone || ''} onChange={handleChange} className={inputCls} placeholder="010-0000-0000" />
            </div>

            <div className="col-span-2">
              <label className={labelCls}>비고</label>
              <textarea name="notes" value={form.notes || ''} onChange={handleChange} className={inputCls} rows={2} style={{ resize: 'none' }} />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition"
            style={{ backgroundColor: '#003DA5' }}
          >{saving ? '저장 중...' : (item ? '수정 완료' : '추가 완료')}</button>
          <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">취소</button>
        </div>
      </div>
    </div>
  );
}

function PageToast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed z-[9999] flex items-center gap-3 px-5 py-3 rounded-2xl text-white text-sm font-medium"
      style={{
        bottom: '24px', right: '24px',
        backgroundColor: toast.type === 'error' ? '#C62828' : '#003DA5',
        minWidth: '240px', maxWidth: '400px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        animation: 'slideInRight 0.3s cubic-bezier(0.16,1,0.3,1)',
      }}>
      <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{ backgroundColor: toast.type === 'error' ? '#FF8A80' : '#4ADE80', color: 'white' }}>
        {toast.type === 'error' ? '!' : '✓'}
      </div>
      <span className="font-medium">{toast.message}</span>
    </div>
  );
}

export default function MaintenancePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [siteFilter, setSiteFilter] = useState('전체');
  const [searchText, setSearchText] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [schedulePopup, setSchedulePopup] = useState(null);
  const [pageToast, setPageToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setPageToast({ message, type });
    setTimeout(() => setPageToast(null), 3000);
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    getMaintenance().then(r => setItems(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleScheduleUpdate = async (itemId, scheduleJson) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    const payload = {
      site: item.site ?? null,
      category: item.category ?? null,
      item_name: item.item_name,
      system_name: item.system_name ?? null,
      contract_start: item.contract_start ?? null,
      contract_end: item.contract_end ?? null,
      months: item.months ?? null,
      quantity: item.quantity ?? null,
      inspection_count: item.inspection_count != null ? String(item.inspection_count) : null,
      company: item.company ?? null,
      manager_name: item.manager_name ?? null,
      manager_phone: item.manager_phone ?? null,
      inspection_schedule: scheduleJson,
      notes: item.notes ?? null,
    };
    await updateMaintenance(itemId, payload);
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, inspection_schedule: scheduleJson } : i));
    showToast('점검 일정이 저장되었습니다.');
  };

  const openSchedulePopup = (e, item) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSchedulePopup({ item, anchorRect: rect });
  };

  const filtered = items.filter(item => {
    if (siteFilter !== '전체' && item.site !== siteFilter) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      return (
        item.item_name?.toLowerCase().includes(q) ||
        item.system_name?.toLowerCase().includes(q) ||
        item.company?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMaintenance(deleteTarget.id);
    setDeleteTarget(null);
    load();
    showToast('항목이 삭제되었습니다.');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F4F6FA' }}>
        <AppHeader activePath="/maintenance" />
        <div className="flex-1 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
            <circle cx="14" cy="14" r="11" stroke="#E2E8F0" strokeWidth="3" />
            <path d="M14 3a11 11 0 0 1 11 11" stroke="#003DA5" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F4F6FA' }}>
      <AppHeader activePath="/maintenance" />

      <div className="flex-1 p-6 max-w-screen-2xl mx-auto w-full">

        {/* 상단 툴바 */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-white rounded-xl p-1" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #F1F5F9' }}>
              {['전체', '본사', '하남IDC'].map(s => (
                <button
                  key={s}
                  onClick={() => setSiteFilter(s)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold transition"
                  style={{
                    backgroundColor: siteFilter === s ? '#003DA5' : 'transparent',
                    color: siteFilter === s ? 'white' : '#64748B',
                  }}
                >{s}</button>
              ))}
            </div>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              <input
                type="text"
                placeholder="품목, 시스템명, 업체 검색..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                style={{ width: '240px' }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">{filtered.length}개 항목</span>
            {isAdmin && (
              <button
                onClick={() => { setEditItem(null); setShowModal(true); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: '#003DA5' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                항목 추가
              </button>
            )}
          </div>
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #F1F5F9' }}>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: '1400px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #F1F5F9', backgroundColor: '#FAFBFC' }}>
                  {['사이트', '구분', '품목', '시스템명', '계약기간', '개월', '수량', '점검 주기', '업체', '담당자', '월별 점검 일정', '비고', ''].map((h, i) => (
                    <th key={i} className="px-3 py-3 text-left text-xs font-semibold text-gray-400 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-16 text-center text-sm text-gray-400">
                      {searchText || siteFilter !== '전체' ? '검색 결과가 없습니다.' : '등록된 유지보수 항목이 없습니다.'}
                    </td>
                  </tr>
                ) : filtered.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #F8FAFC' : 'none' }}
                    className="hover:bg-gray-50 transition">
                    <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">{item.site || '-'}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {item.category ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#EEF2FF', color: '#4338CA' }}>
                          {item.category}
                        </span>
                      ) : <span className="text-xs text-gray-300">-</span>}
                    </td>
                    <td className="px-3 py-3 text-xs font-semibold text-gray-800 whitespace-nowrap max-w-[160px] truncate">{item.item_name}</td>
                    <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap max-w-[120px] truncate">{item.system_name || '-'}</td>
                    <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">
                      <div className="flex flex-col">
                        {item.contract_start && <span>{item.contract_start}</span>}
                        {item.contract_end && (
                          <span className="flex items-center">
                            {item.contract_end}
                            <ExpiryBadge contractEnd={item.contract_end} />
                          </span>
                        )}
                        {!item.contract_start && !item.contract_end && <span className="text-gray-300">-</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600 text-center">{item.months ?? '-'}</td>
                    <td className="px-3 py-3 text-xs text-gray-600 text-center">{item.quantity ?? '-'}</td>
                    <td className="px-3 py-3 text-xs text-gray-600 text-center">{item.inspection_count || '-'}</td>
                    <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap max-w-[120px] truncate">{item.company || '-'}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {item.manager_name || item.manager_phone ? (
                        <div className="flex flex-col text-xs">
                          {item.manager_name && <span className="font-medium text-gray-700">{item.manager_name}</span>}
                          {item.manager_phone && <span className="text-gray-400 font-mono">{item.manager_phone}</span>}
                        </div>
                      ) : <span className="text-xs text-gray-300">-</span>}
                    </td>
                    <td className="px-3 py-3">
                      {isAdmin ? (
                        <button
                          onClick={(e) => openSchedulePopup(e, item)}
                          className="flex items-center gap-1.5 group hover:opacity-80 transition"
                        >
                          <ScheduleDots schedule={item.inspection_schedule} />
                          <svg
                            width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"
                            className="opacity-0 group-hover:opacity-100 transition flex-shrink-0"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      ) : (
                        <ScheduleDots schedule={item.inspection_schedule} />
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500 max-w-[120px] truncate" title={item.notes}>{item.notes || '-'}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {isAdmin && (
                        <div className="flex gap-2">
                          <button onClick={() => { setEditItem(item); setShowModal(true); }} className="text-xs text-blue-400 hover:text-blue-600 font-medium transition">수정</button>
                          <button onClick={() => setDeleteTarget(item)} className="text-xs text-red-400 hover:text-red-600 font-medium transition">삭제</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <MaintenanceModal
          item={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSaved={(msg) => { load(); showToast(msg); }}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          item={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {schedulePopup && (
        <SchedulePopup
          item={schedulePopup.item}
          anchorRect={schedulePopup.anchorRect}
          onSave={handleScheduleUpdate}
          onClose={() => setSchedulePopup(null)}
        />
      )}

      <PageToast toast={pageToast} />
    </div>
  );
}
