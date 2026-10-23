// M3 – Phiếu của kỹ thuật viên (US05): sắp theo hạn cam kết tăng dần.
// Kỹ thuật viên chỉ thấy phiếu của mình (server ép bộ lọc theo token); quản lý chọn một kỹ thuật viên để xem.
import { useEffect, useState } from 'react';
import { listTickets } from '../api/tickets.api.js';
import { listTechnicians } from '../api/lookup.api.js';
import { useApi } from '../hooks/useApi.js';
import DataState from '../components/DataState.jsx';
import { PriorityBadge, StatusBadge } from '../components/Badges.jsx';
import { formatDateTime, isOverdue, issueLabel } from '../lib/format.js';

export default function MyTicketsPage({ user }) {
  const isTechnician = user.role === 'KTV';
  const [picked, setPicked] = useState('');
  const technicians = useApi(() => (isTechnician ? Promise.resolve([]) : listTechnicians()), [isTechnician]);

  useEffect(() => {
    if (!isTechnician && !picked && technicians.data?.length) setPicked(String(technicians.data[0].id));
  }, [isTechnician, picked, technicians.data]);

  const technicianId = isTechnician ? user.technicianId : picked;
  const tickets = useApi(async () => {
    if (!technicianId) return [];
    const rows = await listTickets({ technicianId });
    return [...rows].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [technicianId]);

  return (
    <section>
      <h1>{isTechnician ? 'Phiếu của tôi' : 'Phiếu theo kỹ thuật viên'}</h1>
      {!isTechnician && (
        <div className="filters">
          <DataState state={technicians} loadingMessage="Đang tải danh sách kỹ thuật viên…" emptyMessage="Chưa có kỹ thuật viên" onRetry={technicians.reload}>
            {(list) => (
              <label>Kỹ thuật viên
                <select value={picked} onChange={(e) => setPicked(e.target.value)}>
                  {list.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                </select>
              </label>
            )}
          </DataState>
        </div>
      )}
      <DataState
        state={tickets}
        loadingMessage="Đang tải phiếu được giao…"
        emptyMessage={isTechnician ? 'Bạn chưa có phiếu được giao' : 'Kỹ thuật viên này chưa có phiếu được giao'}
        onRetry={tickets.reload}
      >
        {(rows) => (
          <table className="table">
            <thead><tr><th>Mã phiếu</th><th>Khách hàng</th><th>Thiết bị</th><th>Nhóm sự cố</th><th>Ưu tiên</th><th>Hạn cam kết</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td><strong>{t.code}</strong></td>
                  <td>{t.customerName}<div className="muted small">{t.customerPhone}</div></td>
                  <td>{t.deviceModel}<div className="muted small">{t.issueDescription}</div></td>
                  <td>{issueLabel(t.issueGroup)}</td>
                  <td><PriorityBadge priority={t.priority} /></td>
                  <td className={isOverdue(t.dueDate) && t.status !== 'HOAN_TAT' ? 'overdue' : ''}>{formatDateTime(t.dueDate)}</td>
                  <td><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DataState>
    </section>
  );
}
