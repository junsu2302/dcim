import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { createDevice, updateDevice, deleteDevice } from '../api/devices';

const ITEM_TYPE = 'DEVICE';

function SlotModal({ slot, rack, allRacks, allDevices, onClose, onSave }) {
  const [form, setForm] = useState(
    slot?.device ? { ...slot.device } : {
      name: '', manufacturer: '', serial: '',
      u_position: slot?.u, u_size: String(slot?.dragSize || 1),
      introduced_date: '', maintenance_company: '',
      rack_id: rack.id, site: rack.site,
    }
  );

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!form.name) return alert('장비명을 입력해주세요.');
    if (!form.u_position) return alert('U위치를 입력해주세요.');

    const targetRackId = parseInt(form.rack_id);
    const uStart = parseInt(form.u_position);
    const uSize = parseInt(form.u_size) || 1;
    const uEnd = uStart + uSize - 1;
    const currentDeviceId = slot?.device?.id;

    const conflicted = allDevices
      .filter((d) => d.rack_id === targetRackId && d.id !== currentDeviceId)
      .some((d) => {
        const dStart = parseInt(d.u_position);
        const dEnd = dStart + (parseInt(d.u_size) || 1) - 1;
        return uStart <= dEnd && uEnd >= dStart;
      });

    if (conflicted) return alert('해당 U위치에 이미 다른 장비가 있습니다!');

    const targetRack = allRacks.find((r) => r.id === targetRackId);
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
      } else {
        await createDevice(payload);
      }
      onSave();
      onClose();
    } catch (e) {
      const msg = e.response?.data?.detail || '저장 중 오류가 발생했습니다.';
      alert(msg);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('장비를 삭제하시겠습니까?')) {
      await deleteDevice(slot.device.id);
      onSave();
      onClose();
    }
  };

  const selectedRack = allRacks.find((r) => r.id === parseInt(form.rack_id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          {slot?.device ? '✏️ 장비 수정' : `➕ 장비 추가 (${slot?.dragSize || 1}U)`}
        </h3>
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
              <input
                type={type} name={name} value={form[name] || ''} onChange={handleChange}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600 w-28 flex-shrink-0">U사이즈</label>
            <select name="u_size" value={form.u_size} onChange={handleChange}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {[1, 2, 4, 8].map((u) => <option key={u} value={String(u)}>{u}U</option>)}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600 w-28 flex-shrink-0">
              U위치 <span className="text-red-500">*</span>
            </label>
            <input type="number" name="u_position" value={form.u_position || ''} onChange={handleChange}
              min="1" max="42"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600 w-28 flex-shrink-0">랙 선택</label>
            <select name="rack_id" value={form.rack_id} onChange={handleChange}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {allRacks.map((r) => (
                <option key={r.id} value={r.id}>[{r.site}] RACK #{r.rack_number}</option>
              ))}
            </select>
          </div>

          {selectedRack && (
            <div className="bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-600">
              📍 {selectedRack.site} — RACK #{selectedRack.rack_number}
            </div>
          )}
        </div>

        <div className="flex justify-between mt-6">
          <div className="flex gap-2">
            <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">저장</button>
            <button onClick={onClose} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300 transition">취소</button>
          </div>
          {slot?.device && (
            <button onClick={handleDelete} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition">🗑️ 삭제</button>
          )}
        </div>
      </div>
    </div>
  );
}

// 드래그 가능한 장비 슬롯
function DraggableDevice({ device, size, u, onClick }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPE,
    item: () => ({ 
      device: { 
        ...device, 
        u_size: parseInt(size) || 1,
      },
      size: parseInt(size) || 1,
    }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  return (
    <div
      ref={drag}
      onClick={onClick}
      style={{ opacity: isDragging ? 0.4 : 1, height: `${size * 34}px` }}
      className="relative bg-blue-50 border-b border-blue-100 cursor-grab hover:bg-blue-100 transition group flex flex-col"
    >
      {/* U번호 각 행마다 표시 */}
      {Array.from({ length: size }, (_, i) => (
        <div
          key={i}
          className="flex items-center px-2 gap-2"
          style={{ height: '34px', flexShrink: 0 }}
        >
          <div className="text-xs text-gray-400 w-8 flex-shrink-0 font-mono">{u + i}U</div>
        </div>
      ))}
      {/* 장비 블록 — 절대 위치로 U번호 옆에 오버레이 */}
      <div
        className="absolute bg-blue-500 group-hover:bg-blue-600 text-white rounded px-2 py-1 text-xs font-medium flex justify-between items-center transition"
        style={{
          top: '4px',
          bottom: '4px',
          left: '48px',
          right: '8px',
        }}
      >
        <span className="truncate">{device.name}</span>
        <span className="text-blue-200 ml-1 flex-shrink-0">{size}U</span>
      </div>
    </div>
  );
}
// 드래그로 범위 선택
function DragSelectSlot({ u, isSelected, isSelecting, onMouseDown, onMouseEnter, onDrop, allDevices, rackId, onClick }) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ITEM_TYPE,
    drop: (item) => onDrop({...item.device, u_size: item.size}, u, rackId),
    canDrop: (item) => {
      const uSize = parseInt(item.device.u_size) || 1;
      const uEnd = u + uSize - 1;
      const conflicted = allDevices
        .filter((d) => d.rack_id === rackId && d.id !== item.device.id)
        .some((d) => {
          const dStart = parseInt(d.u_position);
          const dEnd = dStart + (parseInt(d.u_size) || 1) - 1;
          return u <= dEnd && uEnd >= dStart;
        });
      return !conflicted;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
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
  const totalU = rack.total_u || 42;

  const selectedUs = dragStart && dragEnd
    ? Array.from({ length: Math.abs(dragEnd - dragStart) + 1 }, (_, i) => Math.min(dragStart, dragEnd) + i)
    : [];

  const handleMouseDown = (u) => {
    setDragStart(u);
    setDragEnd(u);
    setIsDragSelecting(true);
  };

  const handleMouseEnter = (u) => {
    if (isDragSelecting) setDragEnd(u);
  };

  const handleMouseUp = () => {
    if (isDragSelecting && dragStart && dragEnd) {
      const uStart = Math.min(dragStart, dragEnd);
      const uSize = Math.abs(dragEnd - dragStart) + 1;
      setModal({ u: uStart, device: null, dragSize: uSize });
    }
    setIsDragSelecting(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const slotMap = {};
  devices
    .filter((d) => d.rack_id === rack.id)
    .forEach((d) => {
      const size = d.u_size || 1;
      for (let i = 0; i < size; i++) {
        slotMap[d.u_position + i] = { ...d, isStart: i === 0, size };
      }
    });

  const rendered = new Set();

  const handleDrop = async (device, targetU, targetRackId) => {
    console.log('드롭된 device:', device);
    console.log('u_size:', device.u_size, 'size:', device.size);
    const uSize = parseInt(device.u_size) || parseInt(device.size) || 1;
    const uEnd = targetU + uSize - 1;

    const conflicted = allDevices
      .filter((d) => d.rack_id === targetRackId && d.id !== device.id)
      .some((d) => {
        const dStart = parseInt(d.u_position);
        const dEnd = dStart + (parseInt(d.u_size) || 1) - 1;
        return targetU <= dEnd && uEnd >= dStart;
      });

    if (conflicted) return alert('해당 U위치에 이미 다른 장비가 있습니다!');

    const targetRack = allRacks.find((r) => r.id === parseInt(targetRackId));
    await updateDevice(device.id, {
      name: device.name,
      manufacturer: device.manufacturer,
      serial: device.serial,
      u_position: parseInt(targetU),
      u_size: uSize,
      introduced_date: device.introduced_date,
      maintenance_company: device.maintenance_company,
      rack_id: parseInt(targetRackId),
      site: targetRack?.site || device.site,
    });
    onRefresh();
  };

  return (
    <div className="flex flex-col" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200 w-72">
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white px-4 py-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">{rack.site}</div>
          <div className="text-xl font-bold tracking-wide">🖥️ RACK #{rack.rack_number}</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {devices.filter((d) => d.rack_id === rack.id).length}개 장비 /
            {' '}{totalU - devices.filter((d) => d.rack_id === rack.id).reduce((a, d) => a + (d.u_size || 1), 0)}U 여유
          </div>
        </div>

        <div className="bg-gray-50">
          {Array.from({ length: totalU }, (_, i) => i + 1).map((u) => {
            if (rendered.has(u)) return null;
            const slot = slotMap[u];

            if (slot?.isStart) {
              const size = slot.size;
              for (let i = 0; i < size; i++) rendered.add(u + i);
              const deviceData = devices.filter(d => d.rack_id === rack.id).find(d => d.u_position === u);
              return (
                <DraggableDevice
                  key={u}
                  device={deviceData || slot}
                  size={parseInt(deviceData?.u_size) || size}
                  u={u}
                  onClick={() => setModal({ u, device: slot })}
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
        />
      )}
    </div>
  );
}

// DndProvider는 최상위에서 한 번만 감싸야 해요
function RackViewWithDnd(props) {
  return (
    <DndProvider backend={HTML5Backend}>
      <RackView {...props} />
    </DndProvider>
  );
}

export default RackViewWithDnd;