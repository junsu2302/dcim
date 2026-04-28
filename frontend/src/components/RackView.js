import React, { useState, useCallback, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend, getEmptyImage } from 'react-dnd-html5-backend';
import { createDevice, updateDevice, deleteDevice } from '../api/devices';
import { getDeviceHistory } from '../api/history';
import { getDocuments, uploadDocument, deleteDocument, getDownloadUrl } from '../api/documents';

const ITEM_TYPE = 'DEVICE';
const DEVICE_TYPES = {
  '보안': { bg: '#C62828', hover: '#B71C1C', light: '#FFEBEE' },
  '네트워크': { bg: '#1565C0', hover: '#0D47A1', light: '#E3F2FD' },
  '서버': { bg: '#2E7D32', hover: '#1B5E20', light: '#E8F5E9' },
  '기타': { bg: '#6D4C41', hover: '#4E342E', light: '#EFEBE9' },
};
// 토스트 컴포넌트
function Toast({ toasts }) {
  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white animate-fade-in"
          style={{
            backgroundColor: t.type === 'error' ? '#D32F2F' : t.type === 'success' ? '#2E7D32' : '#1565C0',
            minWidth: '280px',
            animation: 'slideIn 0.3s ease',
          }}
        >
          <span>{t.type === 'error' ? '⚠️' : t.type === 'success' ? '✅' : 'ℹ️'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// 토스트 훅
function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return { toasts, showToast };
}

function SlotModal({ slot, rack, allRacks, allDevices, onClose, onSave, showToast }) {
  const [tab, setTab] = useState('info');
  const [form, setForm] = useState(
    slot?.device ? { ...slot.device } : {
      name: '', manufacturer: '', serial: '',
      u_position: slot?.u, u_size: String(slot?.dragSize || 1),
      introduced_date: '', maintenance_company: '',
      rack_id: rack.id, site: rack.site, device_type: '기타',
    }
  );
  const [history, setHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [docType] = useState('품의서');
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);

  useEffect(() => {
    if (slot?.device?.id) {
      getDeviceHistory(slot.device.id).then(r => setHistory(r.data)).catch(() => {});
      getDocuments(slot.device.id).then(r => setDocuments(r.data)).catch(() => {});
    }
  }, [slot?.device?.id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!form.name) return showToast('장비명을 입력해주세요.', 'error');
    if (!form.u_position) return showToast('U위치를 입력해주세요.', 'error');

    const targetRackId = parseInt(form.rack_id);
    const uStart = parseInt(form.u_position);
    const uSize = parseInt(form.u_size) || 1;
    const uEnd = uStart + uSize - 1;
    const currentDeviceId = slot?.device?.id;
    const targetRack = allRacks.find((r) => r.id === targetRackId);
    const maxU = targetRack?.total_u || 42;

    if (uEnd > maxU) return showToast(`랙 크기 초과! 이 랙은 ${maxU}U까지만 가능합니다.`, 'error');

    const conflicted = allDevices
      .filter((d) => d.rack_id === targetRackId && d.id !== currentDeviceId)
      .some((d) => {
        const dStart = parseInt(d.u_position);
        const dEnd = dStart + (parseInt(d.u_size) || 1) - 1;
        return uStart <= dEnd && uEnd >= dStart;
      });

    if (conflicted) return showToast('해당 U위치에 이미 다른 장비가 있습니다!', 'error');

    const payload = {
      ...form,
      rack_id: targetRackId,
      u_position: parseInt(form.u_position),
      u_size: parseInt(form.u_size),
      site: targetRack?.site || rack.site,
    };

    try {
      if (slot?.device) {
        await updateDevice(slot.device.id, payload);
        showToast('장비가 수정되었습니다.', 'success');
      } else {
        await createDevice(payload);
        showToast('장비가 추가되었습니다.', 'success');
      }
      onSave();
      onClose();
    } catch (e) {
      const msg = e.response?.data?.detail || '저장 중 오류가 발생했습니다.';
      showToast(msg, 'error');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('장비를 삭제하시겠습니까?')) {
      await deleteDevice(slot.device.id);
      showToast('장비가 삭제되었습니다.', 'success');
      onSave();
      onClose();
    }
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPendingFile(file);
  };

  const [confirmDoc, setConfirmDoc] = useState(false);

  const handleSaveDoc = () => {
    if (!pendingFile) return;
    setConfirmDoc(true);
  };

  const handleConfirmSaveDoc = async () => {
    setConfirmDoc(false);
    setUploading(true);
    try {
      await uploadDocument(slot.device.id, docType, pendingFile);
      const res = await getDocuments(slot.device.id);
      setDocuments(res.data);
      setPendingFile(null);
      showToast('문서가 업로드되었습니다.', 'success');
    } catch {
      showToast('업로드 중 오류가 발생했습니다.', 'error');
    }
    setUploading(false);
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('문서를 삭제하시겠습니까?')) return;
    await deleteDocument(docId);
    setDocuments(documents.filter(d => d.id !== docId));
    showToast('문서가 삭제되었습니다.', 'success');
  };

  const selectedRack = allRacks.find((r) => r.id === parseInt(form.rack_id));
  const isEdit = !!slot?.device;

  const TABS = isEdit
    ? [{ key: 'info', label: '장비 정보' }, { key: 'documents', label: '문서' }]
    : [{ key: 'info', label: '장비 정보' }];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* 헤더 */}
        <div className="px-6 pt-6 pb-0">
          <h3 className="text-lg font-bold mb-4" style={{ color: '#003DA5' }}>
            {isEdit ? `✏️ ${slot.device.name}` : `➕ 장비 추가 (${slot?.dragSize || 1}U)`}
          </h3>
          {/* 탭 */}
          {isEdit && (
            <div className="flex gap-1 border-b border-gray-200">
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="px-4 py-2 text-sm font-medium transition-all relative"
                  style={{ color: tab === t.key ? '#003DA5' : '#888' }}
                >
                  {t.label}
                  {tab === t.key && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: '#003DA5' }} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="overflow-y-auto px-6 py-4 flex-1">

          {/* 장비 정보 탭 */}
          {tab === 'info' && (
            <div className="flex flex-col gap-3">
              {[
                { label: '장비명', name: 'name', type: 'text', required: true },
                { label: '제조사', name: 'manufacturer', type: 'text' },
                { label: '시리얼', name: 'serial', type: 'text' },
                { label: '도입일', name: 'introduced_date', type: 'date' },
                { label: '유지보수 업체', name: 'maintenance_company', type: 'text' },
              ].map(({ label, name, type, required }) => (
                <div key={name} className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-600 w-28 flex-shrink-0">
                    {label}{required && <span className="text-red-500">*</span>}
                  </label>
                  <input type={type} name={name} value={form[name] || ''} onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-600 w-28 flex-shrink-0">장비 구분</label>
                <select name="device_type" value={form.device_type || '기타'} onChange={handleChange}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {Object.keys(DEVICE_TYPES).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-600 w-28 flex-shrink-0">U사이즈</label>
                <input
                  type="number"
                  name="u_size"
                  min={1}
                  max={48}
                  value={form.u_size}
                  onChange={handleChange}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-600 w-28 flex-shrink-0">U위치 <span className="text-red-500">*</span></label>
                <input type="number" name="u_position" value={form.u_position || ''} onChange={handleChange} min="1"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-600 w-28 flex-shrink-0">랙 선택</label>
                <select name="rack_id" value={form.rack_id} onChange={handleChange}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {allRacks.map((r) => <option key={r.id} value={r.id}>[{r.site}] RACK #{r.rack_number}</option>)}
                </select>
              </div>
              {selectedRack && (
                <div className="bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-600">
                  📍 {selectedRack.site} — RACK #{selectedRack.rack_number} ({selectedRack.total_u || 42}U)
                </div>
              )}
            </div>
          )}

          {/* 변경 이력 탭 */}
          {tab === 'history' && (
            <div className="flex flex-col gap-2">
              {history.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">변경 이력이 없습니다.</div>
              ) : history.map((h) => (
                <div key={h.id} className="rounded-xl border border-gray-100 p-3 text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: h.change_type === 'create' ? '#2E7D32' : h.change_type === 'delete' ? '#C62828' : '#1565C0' }}>
                      {h.change_type === 'create' ? '생성' : h.change_type === 'delete' ? '삭제' : '수정'}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(h.changed_at).toLocaleString('ko-KR')}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex flex-col gap-0.5">
                    {Object.entries(h.snapshot)
                      .filter(([k]) => !['id'].includes(k))
                      .map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span className="text-gray-400 w-28 flex-shrink-0">{k}</span>
                          <span className="text-gray-600">{String(v ?? '-')}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
{/* 문서 저장 확인 모달 */}
          {confirmDoc && (
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 rounded-2xl">
              <div className="bg-white rounded-2xl shadow-2xl p-5 w-72">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E8EEFF' }}>
                    <span className="text-sm">📄</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: '#003DA5' }}>문서 저장</div>
                    <div className="text-xs text-gray-400">저장하시겠습니까?</div>
                  </div>
                </div>
                <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 mb-4">
                  <span className="text-xs text-gray-600 truncate block">{pendingFile?.name}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmSaveDoc}
                    className="flex-1 text-white py-2 rounded-xl text-sm font-semibold transition hover:opacity-90"
                    style={{ backgroundColor: '#003DA5' }}
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setConfirmDoc(false)}
                    className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* 문서 탭 */}
          {tab === 'documents' && (
            <div className="flex flex-col gap-3">
              {/* 업로드 */}
              <div
                className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed cursor-pointer transition-all"
                style={{
                  borderColor: uploading ? '#003DA5' : '#D1D5DB',
                  backgroundColor: uploading ? '#E8EEFF' : '#F9FAFB',
                }}
                onClick={() => document.getElementById(`file-input-${slot.device.id}`).click()}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#003DA5'; e.currentTarget.style.backgroundColor = '#E8EEFF'; }}
                onDragLeave={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.backgroundColor = '#F9FAFB'; }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = '#D1D5DB';
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                  const file = e.dataTransfer.files[0];
                  if (!file) return;
                  setPendingFile(file);
                }}
              >
                <div className="text-2xl">{uploading ? '⏳' : '📎'}</div>
                <div className="text-sm font-semibold" style={{ color: uploading ? '#003DA5' : '#555' }}>
                  {uploading ? '업로드 중...' : '클릭 또는 파일을 여기에 드래그'}
                </div>
                <div className="text-xs text-gray-400">PDF, 이미지, Word 등 모든 파일 형식 지원</div>
                <input
                  id={`file-input-${slot.device.id}`}
                  type="file"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </div>
{/* 선택된 파일 미리보기 */}
              {pendingFile && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-200 bg-blue-50">
                  <span className="text-blue-500 flex-shrink-0">📄</span>
                  <span className="text-sm text-blue-700 truncate flex-1">{pendingFile.name}</span>
                  <button
                    onClick={() => setPendingFile(null)}
                    className="text-gray-400 hover:text-red-400 transition flex-shrink-0 text-xs"
                  >✕</button>
                </div>
              )}
              {/* 문서 목록 */}
              {documents.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">첨부된 문서가 없습니다.</div>
              ) : documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
                      style={{ backgroundColor: '#E8EEFF', color: '#003DA5' }}>{doc.doc_type}</span>
                    <span className="text-sm text-gray-700 truncate">{doc.original_name}</span>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 ml-2">
                    <a href={getDownloadUrl(doc.id)} target="_blank" rel="noreferrer"
                      className="text-xs text-blue-500 hover:text-blue-700 font-medium transition">다운로드</a>
                    <button onClick={() => handleDeleteDoc(doc.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition">삭제</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
          <div className="flex gap-2">
            {tab === 'info' && (
              <button onClick={handleSave}
                className="text-white px-4 py-2 rounded-lg text-sm transition hover:opacity-90"
                style={{ backgroundColor: '#003DA5' }}>저장</button>
            )}
            {tab === 'documents' && pendingFile && (
              <button
                onClick={handleSaveDoc}
                disabled={uploading}
                className="text-white px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-90"
                style={{ backgroundColor: '#003DA5' }}
              >
                {uploading ? '저장 중...' : '📎 문서 저장'}
              </button>
            )}
            <button onClick={onClose}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300 transition">닫기</button>
          </div>
          {tab === 'info' && isEdit && (
            <button onClick={handleDelete}
              className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition">🗑️ 삭제</button>
          )}
        </div>
      </div>
    </div>
  );
}
function DraggableDevice({ device, size, u, onClick, onDrop, allDevices, rackId }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const domRef = React.useRef(null);

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ITEM_TYPE,
    drop: (item, monitor) => {
      // 마우스 위치로 어느 U에 드롭했는지 계산
      const clientOffset = monitor.getClientOffset();
      const rect = domRef.current?.getBoundingClientRect();
      if (clientOffset && rect) {
        const relativeY = clientOffset.y - rect.top;
        const slotIndex = Math.floor(relativeY / 34);
        // 역순: 위가 큰 U번호
        const targetU = u + size - 1 - slotIndex;
        onDrop({ ...item.device, u_size: item.size }, targetU, rackId);
      } else {
        onDrop({ ...item.device, u_size: item.size }, u + size - 1, rackId);
      }
    },
    canDrop: (item, monitor) => {
      if (item.device.id === device.id) {
        // 자기 자신: 어디든 이동 가능
        return true;
      }
      // 다른 장비: 마우스 위치 기준으로 체크
      const clientOffset = monitor.getClientOffset();
      const rect = domRef.current?.getBoundingClientRect();
      let targetU = u + size - 1;
      if (clientOffset && rect) {
        const relativeY = clientOffset.y - rect.top;
        const slotIndex = Math.floor(relativeY / 34);
        targetU = u + size - 1 - slotIndex;
      }
      const uSize = parseInt(item.device.u_size) || 1;
      const uStart = targetU - uSize + 1;
      const uEnd = targetU;
      if (uStart < 1) return false;
      const conflicted = allDevices
        .filter((d) => d.rack_id === rackId && d.id !== item.device.id)
        .some((d) => {
          const dStart = parseInt(d.u_position);
          const dEnd = dStart + (parseInt(d.u_size) || 1) - 1;
          return uStart <= dEnd && uEnd >= dStart;
        });
      return !conflicted;
    },
    collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
  }));

  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: ITEM_TYPE,
    item: () => ({
      device: { ...device, u_size: parseInt(size) || 1, device_type: device.device_type || '기타' },
      size: parseInt(size) || 1,
    }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  useEffect(() => {
    if (isDragging) setShowTooltip(false);
  }, [isDragging]);

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  return (
    <div
      id={`device-${device.id}`}
      ref={(node) => { drag(node); drop(node); domRef.current = node; }}
      onClick={onClick}
      onMouseEnter={() => { if (!isDragging) setShowTooltip(true); }}
      onMouseLeave={() => setShowTooltip(false)}
      style={{ 
        opacity: isDragging ? 0.4 : 1, 
        height: `${size * 34}px`,
        backgroundColor: isOver && canDrop ? '#E8F5E9' : isOver && !canDrop ? '#FFEBEE' : '#EFF6FF',
      }}
      className="relative border-b border-blue-100 cursor-grab transition group flex flex-col"
    >
      {Array.from({ length: size }, (_, i) => (
        <div key={i} className="flex items-center px-2 gap-2" style={{ height: '34px', flexShrink: 0 }}>
          <div className="text-xs text-gray-400 w-8 flex-shrink-0 font-mono">{u + size - 1 - i}U</div>
        </div>
      ))}
      {isOver && canDrop && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ left: '48px' }}>
          <div className="text-xs text-green-600 font-medium">여기에 놓기</div>
        </div>
      )}
      {isOver && !canDrop && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ left: '48px' }}>
          <div className="text-xs text-red-400 font-medium">배치 불가</div>
        </div>
      )}
      <div
        className="absolute text-white rounded px-2 py-1 text-xs font-medium flex justify-between items-center transition"
        style={{
          top: '4px', bottom: '4px', left: '48px', right: '8px',
          backgroundColor: DEVICE_TYPES[device.device_type]?.bg || DEVICE_TYPES['기타'].bg
        }}
      >
        <span className="truncate">{device.name}</span>
        <span className="ml-1 flex-shrink-0 opacity-70">{size}U</span>
      </div>

      {/* 툴팁 */}
      {showTooltip && !isDragging && !document.querySelector('[data-is-dragging]') && (
        <div
          className="absolute z-50 bg-white rounded-xl shadow-2xl p-3 text-xs border border-gray-100 pointer-events-none"
          style={{ left: '105%', top: '50%', transform: 'translateY(-50%)', minWidth: '200px', maxWidth: '260px' }}
        >
          <div className="font-bold mb-2 text-sm" style={{ color: '#003DA5' }}>{device.name}</div>
          <div className="flex flex-col gap-1 text-gray-600">
            {device.manufacturer && (
              <div className="flex gap-2"><span className="text-gray-400 flex-shrink-0 w-16">제조사</span><span className="break-all">{device.manufacturer}</span></div>
            )}
            {device.serial && (
              <div className="flex gap-2"><span className="text-gray-400 flex-shrink-0 w-16">시리얼</span><span className="font-mono break-all">{device.serial}</span></div>
            )}
            {device.introduced_date && (
              <div className="flex gap-2"><span className="text-gray-400 flex-shrink-0 w-16">도입일</span><span className="break-all">{device.introduced_date}</span></div>
            )}
            {device.maintenance_company && (
              <div className="flex gap-2"><span className="text-gray-400 flex-shrink-0 w-16">유지보수</span><span className="break-all">{device.maintenance_company}</span></div>
            )}
            <div className="flex gap-2 mt-1 pt-1 border-t border-gray-100">
              <span className="text-gray-400 flex-shrink-0 w-16">위치</span>
              <span>{device.u_position}U ~ {device.u_position + size - 1}U ({size}U)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DragSelectSlot({ u, isSelected, isSelecting, onMouseDown, onMouseEnter, onDrop, allDevices, rackId, onClick }) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ITEM_TYPE,
    drop: (item) => onDrop({ ...item.device, u_size: item.size }, u, rackId),
    canDrop: (item) => {
      const uSize = parseInt(item.device.u_size) || 1;
      const uStart = u - uSize + 1;
      const uEnd = u;
      if (uStart < 1) return false;
      const conflicted = allDevices
        .filter((d) => d.rack_id === rackId && d.id !== item.device.id)
        .some((d) => {
          const dStart = parseInt(d.u_position);
          const dEnd = dStart + (parseInt(d.u_size) || 1) - 1;
          return uStart <= dEnd && uEnd >= dStart;
        });
      return !conflicted;
    },
    collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
  }));

  let bg = 'bg-white hover:bg-green-50';
  if (isSelected) bg = 'bg-green-200';
  else if (isOver && canDrop) bg = 'bg-green-100';
  else if (isOver && !canDrop) bg = 'bg-red-100';

  return (
    <div
      ref={drop}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={`flex items-center border-b border-gray-100 px-2 cursor-pointer transition select-none ${bg}`}
      style={{ minHeight: '34px' }}
    >
      <div className="text-xs text-gray-400 w-8 flex-shrink-0 font-mono">{u}U</div>
      <div className={`text-xs transition ${isSelected ? 'text-green-600 font-medium' : isOver && canDrop ? 'text-green-500' : isOver && !canDrop ? 'text-red-400' : 'text-gray-300 hover:text-green-400'}`}>
        {isSelected ? '✓ 선택됨' : isOver && canDrop ? '여기에 놓기' : isOver && !canDrop ? '배치 불가' : '+ 장비 추가'}
      </div>
    </div>
  );
}

function RackView({ rack, devices, allRacks, allDevices, onRefresh }) {
  const [modal, setModal] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [isDragSelecting, setIsDragSelecting] = useState(false);
  const { toasts, showToast } = useToast();
  const totalU = rack.total_u || 42;

  const selectedUs = dragStart && dragEnd
    ? Array.from({ length: Math.abs(dragEnd - dragStart) + 1 }, (_, i) => Math.min(dragStart, dragEnd) + i)
    : [];

  const handleMouseDown = (u) => { setDragStart(u); setDragEnd(u); setIsDragSelecting(true); };
  const handleMouseEnter = (u) => { if (isDragSelecting) setDragEnd(u); };
  const handleMouseUp = () => {
    if (isDragSelecting && dragStart && dragEnd) {
      const uStart = Math.min(dragStart, dragEnd);
      const uEnd = Math.max(dragStart, dragEnd);
      const uSize = uEnd - uStart + 1;

      // 선택 범위 내 장비 충돌 체크
      const conflicted = devices
        .filter((d) => d.rack_id === rack.id)
        .filter((d) => {
          const dStart = parseInt(d.u_position);
          const dEnd = dStart + (parseInt(d.u_size) || 1) - 1;
          return uStart <= dEnd && uEnd >= dStart;
        });

      if (conflicted.length > 0) {
        const names = conflicted.map(d => `${d.name}(${d.u_position}U)`).join(', ');
        showToast(`선택 범위에 이미 장비가 있습니다: ${names}`, 'error');
        setIsDragSelecting(false);
        setDragStart(null);
        setDragEnd(null);
        return;
      }

      // 랙 크기 초과 체크
      if (uEnd > totalU) {
        showToast(`랙 크기(${totalU}U)를 초과하는 범위입니다!`, 'error');
        setIsDragSelecting(false);
        setDragStart(null);
        setDragEnd(null);
        return;
      }

      setModal({ u: uStart, device: null, dragSize: uSize });
    }
    setIsDragSelecting(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const slotMap = {};
  devices.filter((d) => d.rack_id === rack.id).forEach((d) => {
    const size = d.u_size || 1;
    for (let i = 0; i < size; i++) {
      slotMap[d.u_position + i] = { ...d, isStart: i === size - 1, size };
    }
  });

  const rendered = new Set();

  const handleDrop = async (device, targetU, targetRackId) => {
    const uSize = parseInt(device.u_size) || 1;
    const uStart = targetU - uSize + 1;
    const uEnd = targetU;

    const targetRack = allRacks.find((r) => r.id === parseInt(targetRackId));
    const maxU = targetRack?.total_u || 42;

    if (uStart < 1) return showToast('랙 범위를 벗어납니다!', 'error');
    if (uEnd > maxU) return showToast(`랙 크기 초과! 이 랙은 ${maxU}U까지만 가능합니다.`, 'error');

    const conflicted = allDevices
      .filter((d) => d.rack_id === targetRackId && d.id !== device.id)
      .some((d) => {
        const dStart = parseInt(d.u_position);
        const dEnd = dStart + (parseInt(d.u_size) || 1) - 1;
        return uStart <= dEnd && uEnd >= dStart;
      });

    if (conflicted) return showToast('해당 U위치에 이미 다른 장비가 있습니다!', 'error');

    await updateDevice(device.id, {
      name: device.name,
      manufacturer: device.manufacturer,
      serial: device.serial,
      u_position: uStart,
      u_size: uSize,
      introduced_date: device.introduced_date,
      maintenance_company: device.maintenance_company,
      rack_id: parseInt(targetRackId),
      site: targetRack?.site || device.site,
      device_type: device.device_type || '기타',
    });
    showToast('장비 위치가 변경되었습니다.', 'success');
    onRefresh();
  };

  return (
    <>
      <Toast toasts={toasts} />
      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }`}</style>
      <div className="flex flex-col" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        <div className="rounded-2xl overflow-visible shadow-lg border border-gray-200 w-72">
          <div className="text-white px-4 py-3" style={{ background: 'linear-gradient(135deg, #003DA5, #0055CC)' }}>
            <div className="text-xs font-semibold uppercase tracking-widest mb-0.5 opacity-60">{rack.site}</div>
            <div className="text-xl font-bold tracking-wide">🖥️ RACK #{rack.rack_number}</div>
            <div className="text-xs mt-0.5 opacity-60">
              {devices.filter((d) => d.rack_id === rack.id).length}개 장비 /&nbsp;
              {totalU - devices.filter((d) => d.rack_id === rack.id).reduce((a, d) => a + (d.u_size || 1), 0)}U 여유
            </div>
          </div>

          <div className="bg-gray-50 overflow-visible">
            {Array.from({ length: totalU }, (_, i) => totalU - i).map((u) => {
              if (rendered.has(u)) return null;
              const slot = slotMap[u];

              if (slot?.isStart) {
                const size = slot.size;
                // 역순: u가 가장 큰 번호(화면 위), 실제 시작은 u - size + 1
                const actualStart = u - size + 1;
                for (let i = 0; i < size; i++) rendered.add(actualStart + i);
                const deviceData = devices.filter(d => d.rack_id === rack.id).find(d => d.u_position === actualStart);
                return (
                  <DraggableDevice
                    key={u}
                    device={deviceData || slot}
                    size={parseInt(deviceData?.u_size) || size}
                    u={actualStart}
                    onClick={() => setModal({ u: actualStart, device: slot })}
                    onDrop={handleDrop}
                    allDevices={allDevices}
                    rackId={rack.id}
                  />
                );
              }

              rendered.add(u);
              return (
                <DragSelectSlot
                  key={u}
                  u={u}
                  rackId={rack.id}
                  allDevices={allDevices}
                  isSelected={selectedUs.includes(u)}
                  isSelecting={isDragSelecting}
                  onMouseDown={() => handleMouseDown(u)}
                  onMouseEnter={() => handleMouseEnter(u)}
                  onClick={() => !isDragSelecting && setModal({ u, device: null })}
                  onDrop={handleDrop}
                />
              );
            })}
          </div>
        </div>

        {modal && (
          <SlotModal
            slot={modal}
            rack={rack}
            allRacks={allRacks}
            allDevices={allDevices}
            onClose={() => setModal(null)}
            onSave={onRefresh}
            showToast={showToast}
          />
        )}
      </div>
    </>
  );
}

function RackViewWithDnd(props) {
  return (
    <DndProvider backend={HTML5Backend}>
      <RackView {...props} />
    </DndProvider>
  );
}

export default RackViewWithDnd;