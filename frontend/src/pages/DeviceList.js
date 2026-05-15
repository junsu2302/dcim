import React, { useEffect, useState, useMemo } from 'react';
import { getRacks } from '../api/racks';
import { getDevices } from '../api/devices';
import { createSnapshot, getSnapshots } from '../api/snapshots';
import { useAuth } from '../context/AuthContext';
import { getDocuments, downloadDocument } from '../api/documents';
import { getVmCounts, getVMs } from '../api/vms';
import AppHeader from '../components/AppHeader';
import * as XLSX from 'xlsx';

const PAGE_SIZE = 20;

const HEADERS = [
  { label: 'No', key: '_no', width: '4%' },
  { label: '사이트', key: 'site', width: '6%' },
  { label: '구분', key: 'device_type', width: '6%' },
  { label: '장비명', key: 'name', width: '10%' },
  { label: '제조사', key: 'manufacturer', width: '7%' },
  { label: '모델명', key: 'product_name', width: '9%' },
  { label: 'IP', key: 'ip_address', width: '9%' },
  { label: '시리얼', key: 'serial', width: '8%' },
  { label: '랙번호', key: 'rack_id', width: '6%' },
  { label: 'U위치', key: 'u_position', width: '5%' },
  { label: 'U사이즈', key: 'u_size', width: '5%' },
  { label: '도입일', key: 'introduced_date', width: '8%' },
  { label: '만료일', key: 'maintenance_expiry_date', width: '8%' },
  { label: '유지보수 업체', key: 'maintenance_company', width: '8%' },
  { label: '첨부문서', key: '_docs', width: '7%' },
];

function expiryBadge(dateStr) {
  if (!dateStr) return null;
  const days = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { text: '만료', bg: '#FECACA', color: '#991B1B' };
  if (days <= 7) return { text: `D-${days}`, bg: '#FEF3C7', color: '#92400E' };
  if (days <= 30) return { text: `D-${days}`, bg: '#FEF9C3', color: '#713F12' };
  return null;
}

function DeviceList() {
  const [devices, setDevices] = useState([]);
  const [racks, setRacks] = useState([]);
  const [search, setSearch] = useState('');
  const [filterSite, setFilterSite] = useState('전체');
  const [deviceDocs, setDeviceDocs] = useState({});
  const [vmCounts, setVmCounts] = useState({});
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState('전체');
  const [filterExpiry, setFilterExpiry] = useState('전체');
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [lastSnapshotName, setLastSnapshotName] = useState('');
  const [confirmStep, setConfirmStep] = useState(false);
  const [saveToast, setSaveToast] = useState(null);
  const [vmModal, setVmModal] = useState(null);
  const [vmModalList, setVmModalList] = useState([]);
  const [vmModalLoading, setVmModalLoading] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => { fetchDevices(); }, []);

  useEffect(() => {
    if (!saveToast) return;
    const t = setTimeout(() => setSaveToast(null), 3000);
    return () => clearTimeout(t);
  }, [saveToast]);

  const fetchDevices = async () => {
    const [devRes, rackRes] = await Promise.all([getDevices(), getRacks()]);
    setDevices(devRes.data);
    setRacks(rackRes.data);
    getVmCounts().then(r => setVmCounts(r.data)).catch(() => {});
    const docsMap = {};
    await Promise.all(devRes.data.map(async (d) => {
      const docRes = await getDocuments(d.id);
      docsMap[d.id] = docRes.data;
    }));
    setDeviceDocs(docsMap);
  };

  const filtered = useMemo(() => {
    return devices
      .filter(d => {
        const matchSite = filterSite === '전체' || d.site === filterSite;
        const matchType = filterType === '전체' || d.device_type === filterType;
        const q = search.toLowerCase();
        const matchSearch = !q ||
          d.name?.toLowerCase().includes(q) ||
          d.manufacturer?.toLowerCase().includes(q) ||
          d.serial?.toLowerCase().includes(q) ||
          d.maintenance_company?.toLowerCase().includes(q) ||
          d.ip_address?.toLowerCase().includes(q) ||
          d.product_name?.toLowerCase().includes(q);
        let matchExpiry = true;
        if (filterExpiry !== '전체' && d.maintenance_expiry_date) {
          const days = Math.ceil((new Date(d.maintenance_expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
          if (filterExpiry === '만료') matchExpiry = days < 0;
          else if (filterExpiry === 'D-7') matchExpiry = days >= 0 && days <= 7;
          else if (filterExpiry === 'D-30') matchExpiry = days >= 0 && days <= 30;
        } else if (filterExpiry !== '전체') {
          matchExpiry = false;
        }
        return matchSite && matchType && matchSearch && matchExpiry;
      })
      .sort((a, b) => {
        const siteOrder = { '본사': 0, '하남IDC': 1 };
        if (a.site !== b.site) return (siteOrder[a.site] ?? 99) - (siteOrder[b.site] ?? 99);
        if (a.rack_id !== b.rack_id) return (a.rack_id || 0) - (b.rack_id || 0);
        return (b.u_position || 0) - (a.u_position || 0);
      });
  }, [devices, filterSite, search, filterType, filterExpiry]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleVmModalOpen = async (device) => {
    setVmModal(device);
    setVmModalLoading(true);
    setVmModalList([]);
    try {
      const res = await getVMs(device.id);
      setVmModalList(res.data);
    } catch {}
    setVmModalLoading(false);
  };

  const exportToExcel = () => {
    const rows = filtered.map((d, idx) => {
      const rack = racks.find(r => r.id === d.rack_id);
      return {
        'No': idx + 1,
        '사이트': d.site || '',
        '구분': d.device_type || '기타',
        '장비명': d.name || '',
        '제조사': d.manufacturer || '',
        '모델명': d.product_name || '',
        'IP 주소': d.ip_address || '',
        '시리얼': d.serial || '',
        '랙 번호': rack ? `RACK #${rack.rack_number}` : '',
        'U 위치': d.u_position ?? '',
        'U 사이즈': d.u_size ?? '',
        '도입일': d.introduced_date || '',
        '유지보수 만료일': d.maintenance_expiry_date || '',
        '유지보수 업체': d.maintenance_company || '',
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '장비목록');
    const fileName = `장비목록_${new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F6FA' }}>
      <AppHeader activePath="/devices" />

      {/* 툴바 */}
      <div className="bg-white border-b border-gray-100 px-8 py-2.5 flex justify-end items-center" style={{ minHeight: '44px' }}>
        <div className="flex items-center gap-2">
          <button onClick={exportToExcel}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition border"
            style={{ backgroundColor: '#fff', color: '#2E7D32', borderColor: '#2E7D32' }}>
            ⬇ 엑셀 내보내기
          </button>
          {isAdmin && (
            <button onClick={async () => {
              const res = await getSnapshots();
              setLastSnapshotName(res.data[0]?.memo || '');
              setShowSnapshotModal(true);
            }}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition hover:opacity-90"
              style={{ backgroundColor: '#003DA5', color: 'white' }}>
              스냅샷 저장
            </button>
          )}
        </div>
      </div>

      {/* 스냅샷 모달 */}
      {showSnapshotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 border border-gray-100" style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            {!confirmStep ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#FFB81C' }} />
                  <h3 className="text-base font-bold" style={{ color: '#003DA5' }}>스냅샷 저장</h3>
                </div>
                <p className="text-xs text-gray-400 mb-4 ml-3">현재 전체 랙/장비 현황을 저장합니다.</p>
                <label className="text-xs font-semibold mb-1 block" style={{ color: '#003DA5' }}>
                  저장명 <span style={{ color: '#C62828' }}>*</span>
                </label>
                <input type="text" value={snapshotName} onChange={e => setSnapshotName(e.target.value)}
                  placeholder="저장명을 입력하세요."
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  style={{ borderColor: snapshotName.trim() ? '#D1D5DB' : '#FCA5A5' }} />
                {lastSnapshotName && (
                  <p className="text-xs text-gray-400 mt-1.5 ml-1">이전 저장명: <span className="font-medium text-gray-500">{lastSnapshotName}</span></p>
                )}
                {!snapshotName.trim() && (
                  <p className="text-xs mt-1 ml-1" style={{ color: '#C62828' }}>저장명은 필수 입력 항목입니다.</p>
                )}
                <div className="flex gap-2 mt-4">
                  <button disabled={!snapshotName.trim()} onClick={() => setConfirmStep(true)}
                    className="flex-1 text-white py-2.5 rounded-xl text-sm font-semibold transition"
                    style={{ backgroundColor: snapshotName.trim() ? '#003DA5' : '#9CA3AF', cursor: snapshotName.trim() ? 'pointer' : 'not-allowed' }}>
                    다음
                  </button>
                  <button onClick={() => { setShowSnapshotModal(false); setSnapshotName(''); setConfirmStep(false); }}
                    className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">
                    취소
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#FFB81C' }} />
                  <h3 className="text-base font-bold" style={{ color: '#003DA5' }}>저장 확인</h3>
                </div>
                <p className="text-xs text-gray-400 mb-4 ml-3">아래 내용으로 스냅샷을 저장하시겠습니까?</p>
                <div className="rounded-xl p-4 mb-1" style={{ backgroundColor: '#F4F6FA', border: '1px solid #E8EEFF' }}>
                  <div className="flex flex-col gap-2.5 text-xs">
                    <div className="flex gap-3"><span className="text-gray-400 w-14">저장명</span><span className="font-semibold" style={{ color: '#003DA5' }}>{snapshotName}</span></div>
                    <div className="flex gap-3"><span className="text-gray-400 w-14">작성자</span><span className="font-semibold text-gray-700">{user?.username}</span></div>
                    <div className="flex gap-3"><span className="text-gray-400 w-14">시각</span><span className="text-gray-600">{new Date().toLocaleString('ko-KR')}</span></div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={async () => {
                    await createSnapshot(snapshotName.trim(), user?.username || '');
                    setShowSnapshotModal(false); setSnapshotName(''); setConfirmStep(false);
                    setSaveToast(snapshotName.trim());
                  }} className="flex-1 text-white py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90" style={{ backgroundColor: '#003DA5' }}>
                    저장
                  </button>
                  <button onClick={() => setConfirmStep(false)}
                    className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">
                    돌아가기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {saveToast && (
        <div className="fixed z-50 flex items-center gap-3 px-5 py-3 rounded-2xl text-white text-sm font-medium"
          style={{ bottom: '24px', right: '24px', backgroundColor: '#003DA5', minWidth: '280px', boxShadow: '0 8px 32px rgba(0,61,165,0.35)' }}>
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#4ADE80' }}>✓</div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold">스냅샷이 저장되었습니다.</span>
            <span className="text-xs font-normal truncate" style={{ opacity: 0.7 }}>{saveToast}</span>
          </div>
        </div>
      )}

      {/* 통계 카드 */}
      <div className="px-16 py-3 border-b" style={{ backgroundColor: '#fff' }}>
        <div className="flex gap-3 mb-3">
          {[
            { key: '전체', label: '전체', count: devices.length },
            { key: '본사', label: '본사', count: devices.filter(d => d.site === '본사').length },
            { key: '하남IDC', label: '하남IDC', count: devices.filter(d => d.site === '하남IDC').length },
          ].map(tab => (
            <button key={tab.key} onClick={() => { setFilterSite(tab.key); setPage(1); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                backgroundColor: filterSite === tab.key ? '#003DA5' : '#F4F6FA',
                color: filterSite === tab.key ? 'white' : '#555',
                boxShadow: filterSite === tab.key ? '0 4px 12px rgba(0,61,165,0.25)' : 'none',
              }}>
              <span>{tab.label}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: filterSite === tab.key ? 'rgba(255,255,255,0.25)' : '#E5E7EB', color: filterSite === tab.key ? 'white' : '#555' }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-6 gap-3">
          {(() => {
            const site = filterSite;
            const inSite = d => site === '전체' || d.site === site;
            const vmServerDevices = devices.filter(d => d.device_type === 'VM서버' && inSite(d));
            const totalVMs = vmServerDevices.reduce((sum, d) => sum + (vmCounts[d.id] || 0), 0);
            return [
              { label: '전체 장비', value: devices.filter(inSite).length, color: '#003DA5', icon: '🖥️', sub: null },
              { label: '보안', value: devices.filter(d => d.device_type === '보안' && inSite(d)).length, color: '#C62828', icon: '🔒', sub: null },
              { label: '네트워크', value: devices.filter(d => d.device_type === '네트워크' && inSite(d)).length, color: '#1565C0', icon: '🌐', sub: null },
              { label: '서버', value: devices.filter(d => d.device_type === '서버' && inSite(d)).length, color: '#2E7D32', icon: '⚙️', sub: null },
              { label: 'VM서버', value: vmServerDevices.length, color: '#6A1B9A', icon: '🔷', sub: totalVMs > 0 ? `VM ${totalVMs}개` : null },
              { label: '기타', value: devices.filter(d => (!d.device_type || d.device_type === '기타') && inSite(d)).length, color: '#6D4C41', icon: '📦', sub: null },
            ];
          })().map(stat => (
            <div key={stat.label} className="rounded-xl p-3 flex items-center gap-3"
              style={{ backgroundColor: stat.color + '10', border: `1.5px solid ${stat.color}22` }}>
              <div className="text-2xl w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: stat.color + '18' }}>{stat.icon}</div>
              <div>
                <div className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                <div className="text-xs font-semibold mt-0.5" style={{ color: stat.color, visibility: stat.sub ? 'visible' : 'hidden' }}>{stat.sub || '-'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-16 py-5">
        {/* 검색 & 필터 */}
        <div className="bg-white rounded-xl p-3 mb-4 flex gap-3 items-center flex-wrap" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="flex-1 relative min-w-52">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="장비명, 제조사, IP, 시리얼, 유지보수 업체, 모델명..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
          </div>
          <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white">
            {['전체', '보안', '네트워크', '서버', 'VM서버', '기타'].map(t => (
              <option key={t} value={t}>{t === '전체' ? '구분: 전체' : t}</option>
            ))}
          </select>
          <select value={filterExpiry} onChange={e => { setFilterExpiry(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white">
            {[
              { value: '전체', label: '만료: 전체' },
              { value: '만료', label: '만료됨' },
              { value: 'D-7', label: 'D-7 이내' },
              { value: 'D-30', label: 'D-30 이내' },
            ].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {(search || filterType !== '전체' || filterExpiry !== '전체') && (
            <button onClick={() => { setSearch(''); setFilterType('전체'); setFilterExpiry('전체'); setPage(1); }}
              className="text-xs text-gray-400 hover:text-gray-600 transition px-2 py-1 rounded-lg hover:bg-gray-100">
              필터 초기화
            </button>
          )}
          <span className="text-xs text-gray-400">총 {filtered.length}개</span>
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-xl" style={{ overflowX: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <table className="text-sm" style={{ minWidth: '1500px', width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ backgroundColor: '#003DA5' }}>
                {HEADERS.map(h => (
                  <th key={h.key} className="px-3 py-3 text-left text-white font-medium text-xs whitespace-nowrap"
                    style={{ width: h.width }}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((device, idx) => {
                const rack = racks.find(r => r.id === device.rack_id);
                const badge = expiryBadge(device.maintenance_expiry_date);
                const vmCount = device.device_type === 'VM서버' ? (vmCounts[device.id] || 0) : -1;
                return (
                  <tr key={device.id}
                    className="border-b border-gray-100 hover:bg-blue-50 transition"
                    style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#FAFBFF' }}>
                    <td className="px-3 py-4 text-gray-400 text-xs">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: device.site === '본사' ? '#E8EEFF' : '#FFF3E0', color: device.site === '본사' ? '#003DA5' : '#E65100' }}>
                        {device.site}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{
                          backgroundColor: device.device_type === '보안' ? '#C62828' : device.device_type === '네트워크' ? '#1565C0' : device.device_type === '서버' ? '#2E7D32' : device.device_type === 'VM서버' ? '#6A1B9A' : '#6D4C41',
                          display: 'inline-block',
                          whiteSpace: 'nowrap',
                        }}>
                        {device.device_type || '기타'}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-xs" style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {device.device_type === 'VM서버' ? (
                        <button
                          onClick={() => handleVmModalOpen(device)}
                          title={`${device.name} — VM ${vmCount}개 (클릭하여 목록 보기)`}
                          className="flex items-center gap-1.5 font-semibold text-left hover:opacity-75 transition-opacity group w-full"
                          style={{ color: '#6A1B9A', overflow: 'hidden' }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{device.name}</span>
                          <span className="flex-shrink-0 text-[11px] font-bold opacity-70">({vmCount})</span>
                          <svg className="flex-shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                        </button>
                      ) : (
                        <span title={device.name} className="font-semibold" style={{ color: '#003DA5', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{device.name}</span>
                      )}
                    </td>
                    <td title={device.manufacturer} className="px-3 py-4 text-gray-600 text-xs" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{device.manufacturer}</td>
                    <td title={device.product_name} className="px-3 py-4 text-gray-600 text-xs" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{device.product_name}</td>
                    <td title={device.ip_address} className="px-3 py-4 text-gray-500 font-mono text-xs" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{device.ip_address}</td>
                    <td title={device.serial} className="px-3 py-4 text-gray-500 font-mono text-xs" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{device.serial}</td>
                    <td className="px-3 py-4 text-gray-600 text-xs whitespace-nowrap">{rack ? `RACK #${rack.rack_number}` : '-'}</td>
                    <td className="px-3 py-4 text-gray-600 text-xs whitespace-nowrap">{device.u_position}U</td>
                    <td className="px-3 py-4 text-gray-600 text-xs whitespace-nowrap">{device.u_size}U</td>
                    <td className="px-3 py-4 text-gray-600 text-xs whitespace-nowrap">{device.introduced_date || '-'}</td>
                    <td className="px-3 py-4 text-xs whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-600">{device.maintenance_expiry_date || '-'}</span>
                        {badge && (
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: badge.bg, color: badge.color }}>
                            {badge.text}
                          </span>
                        )}
                      </div>
                    </td>
                    <td title={device.maintenance_company} className="px-3 py-4 text-gray-600 text-xs" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{device.maintenance_company}</td>
                    <td className="px-3 py-4">
                      {(deviceDocs[device.id] || []).length === 0 ? (
                        <span className="text-gray-300 text-xs">-</span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {(deviceDocs[device.id] || []).map(doc => (
                            <button key={doc.id} onClick={() => downloadDocument(doc.id, doc.original_name)}
                              className="flex items-center gap-1 hover:opacity-70 transition">
                              <span className="text-xs" style={{ color: '#003DA5' }}>💾</span>
                              <span className="text-xs text-blue-400 truncate max-w-[80px]">{doc.original_name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">📭</div>
              <div className="text-sm">등록된 장비가 없습니다.</div>
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-4">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition"
              style={{ borderColor: page === 1 ? '#E5E7EB' : '#003DA5', color: page === 1 ? '#9CA3AF' : '#003DA5', backgroundColor: '#fff' }}>
              이전
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce((acc, p, i, arr) => {
                if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) => p === '...' ? (
                <span key={`ellipsis-${i}`} className="px-2 text-xs text-gray-400">…</span>
              ) : (
                <button key={p} onClick={() => setPage(p)}
                  className="w-8 h-8 rounded-lg text-xs font-semibold transition"
                  style={{ backgroundColor: page === p ? '#003DA5' : '#fff', color: page === p ? '#fff' : '#374151', border: `1px solid ${page === p ? '#003DA5' : '#E5E7EB'}` }}>
                  {p}
                </button>
              ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition"
              style={{ borderColor: page === totalPages ? '#E5E7EB' : '#003DA5', color: page === totalPages ? '#9CA3AF' : '#003DA5', backgroundColor: '#fff' }}>
              다음
            </button>
          </div>
        )}
      </div>
      {/* VM 목록 모달 */}
      {vmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          onClick={e => { if (e.target === e.currentTarget) setVmModal(null); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: '80vh', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
            {/* 헤더 */}
            <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#6A1B9A' }} />
                    <span className="text-sm font-bold text-gray-800">{vmModal.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#F3E5F5', color: '#6A1B9A' }}>
                      VM {vmModalList.length}개
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 ml-[18px]">
                    {vmModal.manufacturer && <span>{vmModal.manufacturer} · </span>}
                    {vmModal.ip_address && <span className="font-mono">{vmModal.ip_address}</span>}
                    {!vmModal.manufacturer && !vmModal.ip_address && 'VM 서버'}
                  </div>
                </div>
                <button onClick={() => setVmModal(null)}
                  className="text-gray-300 hover:text-gray-500 transition ml-4 flex-shrink-0 mt-0.5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* VM 목록 */}
            <div className="overflow-y-auto flex-1 p-4">
              {vmModalLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-400 text-sm gap-2">
                  <svg width="16" height="16" viewBox="0 0 28 28" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <circle cx="14" cy="14" r="11" stroke="#E2E8F0" strokeWidth="3" />
                    <path d="M14 3a11 11 0 0 1 11 11" stroke="#6A1B9A" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  로딩 중...
                </div>
              ) : vmModalList.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">등록된 VM이 없습니다.</div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {vmModalList.map((vm, i) => (
                    <div key={vm.id} className="rounded-xl border border-gray-100 p-4 hover:border-purple-200 hover:bg-purple-50 transition">
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white" style={{ backgroundColor: '#6A1B9A' }}>
                          {i + 1}
                        </div>
                        <span className="font-semibold text-sm" style={{ color: '#6A1B9A' }}>{vm.name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs ml-8">
                        {[
                          ['IP', vm.ip_address],
                          ['HOST', vm.host_nm],
                          ['OS', vm.os],
                          ['CPU', vm.cpu],
                          ['CORE', vm.core],
                          ['RAM', vm.ram_gb ? `${vm.ram_gb} GB` : null],
                        ].filter(([, v]) => v).map(([label, value]) => (
                          <div key={label} className="flex gap-2 items-center">
                            <span className="text-gray-400 w-10 flex-shrink-0">{label}</span>
                            <span className="text-gray-700 font-mono truncate">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={() => setVmModal(null)}
                className="w-full bg-gray-100 text-gray-600 py-2 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeviceList;
