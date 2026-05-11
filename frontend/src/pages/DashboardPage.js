import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import AppHeader from '../components/AppHeader';

const API = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

const TYPE_COLORS = {
  '보안': '#3B82F6',
  '네트워크': '#10B981',
  '서버': '#F59E0B',
  'VM서버': '#8B5CF6',
  '기타': '#94A3B8',
};

const CHANGE_TYPE_LABEL = { create: '등록', update: '수정', delete: '삭제' };
const CHANGE_TYPE_COLOR = { create: '#10B981', update: '#F59E0B', delete: '#EF4444' };

function StatCard({ label, value, sub, icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 flex items-center gap-4"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #F1F5F9' }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: color + '18' }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <div className="text-xs text-gray-400 font-medium mb-0.5">{label}</div>
        <div className="text-2xl font-bold text-gray-800 leading-tight">{value}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 className="text-sm font-bold text-gray-700 mb-3">{children}</h2>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0];
    return (
      <div className="bg-white rounded-xl px-3 py-2 text-xs font-medium shadow-lg border border-gray-100">
        <span style={{ color: TYPE_COLORS[name] || '#64748B' }}>{name}</span>
        <span className="text-gray-500 ml-2">{value}대</span>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [racks, setRacks] = useState([]);
  const [recentHistory, setRecentHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/devices/`),
      axios.get(`${API}/racks/`),
      axios.get(`${API}/history/recent?limit=8`),
    ]).then(([devRes, rackRes, histRes]) => {
      setDevices(devRes.data);
      setRacks(rackRes.data);
      setRecentHistory(histRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const totalDevices = devices.length;
  const honsa = devices.filter(d => d.site === '본사').length;
  const hanam = devices.filter(d => d.site === '하남IDC').length;

  const typeMap = {};
  devices.forEach(d => {
    const t = d.device_type || '기타';
    typeMap[t] = (typeMap[t] || 0) + 1;
  });
  const typeData = Object.entries(typeMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const rackUtilData = racks.map(r => {
    const used = devices
      .filter(d => d.rack_id === r.id)
      .reduce((sum, d) => sum + (d.u_size || 1), 0);
    const total = r.total_u || 42;
    return {
      name: `${r.site?.replace('하남IDC', '하남') || ''} ${r.rack_number}번`,
      used,
      free: total - used,
      total,
      pct: Math.round((used / total) * 100),
    };
  }).sort((a, b) => b.pct - a.pct).slice(0, 10);

  const avgUtilPct = rackUtilData.length
    ? Math.round(rackUtilData.reduce((s, r) => s + r.pct, 0) / rackUtilData.length)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F4F6FA' }}>
        <AppHeader activePath="/" />
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
      <AppHeader activePath="/" />
      <div className="flex-1 p-6 max-w-screen-xl mx-auto w-full">

        {/* 상단 통계 카드 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard label="전체 장비" value={`${totalDevices}대`} icon="🖥️" color="#003DA5" />
          <StatCard label="본사" value={`${honsa}대`} sub={`전체의 ${totalDevices ? Math.round(honsa/totalDevices*100) : 0}%`} icon="🏢" color="#3B82F6" />
          <StatCard label="하남 IDC" value={`${hanam}대`} sub={`전체의 ${totalDevices ? Math.round(hanam/totalDevices*100) : 0}%`} icon="🗄️" color="#8B5CF6" />
          <StatCard label="평균 랙 사용률" value={`${avgUtilPct}%`} sub={`랙 ${racks.length}개 기준`} icon="📊" color="#10B981" />
        </div>

        {/* 차트 영역 */}
        <div className="grid grid-cols-2 gap-4 mb-6">

          {/* 장비 구분별 파이 차트 */}
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #F1F5F9' }}>
            <SectionTitle>장비 구분별 분포</SectionTitle>
            {typeData.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-sm text-gray-400">데이터 없음</div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="55%" height={180}>
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" innerRadius={48} outerRadius={78}
                      dataKey="value" paddingAngle={3}>
                      {typeData.map((entry) => (
                        <Cell key={entry.name} fill={TYPE_COLORS[entry.name] || '#94A3B8'} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 flex-1">
                  {typeData.map(({ name, value }) => (
                    <div key={name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: TYPE_COLORS[name] || '#94A3B8' }} />
                        <span className="text-xs text-gray-600">{name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-700">{value}대</span>
                        <span className="text-xs text-gray-400">
                          ({totalDevices ? Math.round(value / totalDevices * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 랙별 U 사용률 바 차트 */}
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #F1F5F9' }}>
            <SectionTitle>랙별 U 사용률 (상위 10개)</SectionTitle>
            {rackUtilData.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-sm text-gray-400">데이터 없음</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={rackUtilData} layout="vertical" margin={{ left: 8, right: 24, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`}
                    tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={72}
                    tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val, name) => [name === 'used' ? `${val}U 사용` : `${val}U 여유`, '']}
                    contentStyle={{ fontSize: 11, borderRadius: 10, border: '1px solid #F1F5F9' }}
                  />
                  <Bar dataKey="pct" fill="#003DA5" radius={[0, 4, 4, 0]} name="사용률"
                    label={{ position: 'right', formatter: v => `${v}%`, fontSize: 10, fill: '#64748B' }} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 최근 변경 이력 */}
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #F1F5F9' }}>
          <div className="mb-3">
            <SectionTitle>최근 변경 이력</SectionTitle>
          </div>
          {recentHistory.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">변경 이력이 없습니다.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  {['장비명', '변경 유형', '변경 내용', '변경자', '변경 시각'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 pb-2 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentHistory.map((h, i) => (
                  <tr key={h.id} style={{ borderBottom: i < recentHistory.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                    <td className="py-2.5 pr-4 text-xs font-medium text-gray-700">{h.device_name}</td>
                    <td className="py-2.5 pr-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: (CHANGE_TYPE_COLOR[h.change_type] || '#94A3B8') + '18', color: CHANGE_TYPE_COLOR[h.change_type] || '#94A3B8' }}>
                        {CHANGE_TYPE_LABEL[h.change_type] || h.change_type}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-gray-500 max-w-[140px] truncate" title={h.change_summary}>
                      {h.change_summary || '-'}
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-gray-500">{h.changed_by || '-'}</td>
                    <td className="py-2.5 text-xs text-gray-400">
                      {new Date(h.changed_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
