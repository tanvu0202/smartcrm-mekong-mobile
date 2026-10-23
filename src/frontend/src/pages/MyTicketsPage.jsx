// M3 – Phiếu của tôi (US05): sắp theo hạn cam kết tăng dần, phân trang 20 dòng, cột Lịch hẹn và nút chuyển trạng thái.
// Kỹ thuật viên chỉ thấy phiếu của mình (server ép bộ lọc theo token); quản lý chọn một kỹ thuật viên để xem (chỉ đọc).
import { useEffect, useState } from 'react';
import { listTickets, updateStatus } from '../api/tickets.api.js';
import { listTechnicians } from '../api/lookup.api.js';
import { useApi } from '../hooks/useApi.js';
import DataState from '../components/DataState.jsx';
import Pager from '../components/Pager.jsx';
import { StatusBadge } from '../components/Badges.jsx';
import { formatShort, isOverdue } from '../lib/format.js';
import { paginate } from '../lib/paginate.js';

const PAGE_SIZE = 20;
const NEXT_ACTION = { DA_PHAN_CONG: { to: 'DANG_XU_LY', label: 'Bắt đầu xử lý' }, DANG_XU_LY: { to: 'HOAN_TAT', label: 'Hoàn tất' } };

export default function MyTicketsPage({ user }) {
  const isTechnician = user.role === 'KTV';
  const [picked, setPicked] = useState('');
  const [page, setPage] = useState(1);
  const [msg, setMsg] = useState(null);
  const [busyId, setBusyId] = useState(null);
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

  async function change(t) {
    const next = NEXT_ACTION[t.status];
    setMsg(null);
    setBusyId(t.id);
    try {
      await updateStatus(t.id, next.to);
      setMsg({ type: 'ok', text: `Phiếu ${t.code}: đã chuyển sang "${next.label === 'Hoàn tất' ? 'Hoàn tất' : 'Đang xử lý'}".` });
      tickets.reload();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
      tickets.reload();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section>
      <h1>{isTechnician ? 'M3 · Phiếu được giao cho tôi' : 'M3 · Phiếu theo kỹ thuật viên'}</h1>
      {!isTechnician && (
        <div className="filters">
          <DataState state={technicians} loadingMessage="Đang tải danh sách kỹ thuật viên…" emptyMessage="Chưa có kỹ thuật viên" onRetry={technicians.reload}>
            {(list) => (
              <label>Kỹ thuật viên
                <select value={picked} onChange={(e) => { setPicked(e.target.value); setPage(1); }}>
                  {list.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                </select>
              </label>
            )}
          </DataState>
        </div>
      )}
      {msg && <div className={`state ${msg.type === 'ok' ? 'state-ok' : 'state-error'}`} role={msg.type === 'ok' ? 'status' : 'alert'}>{msg.text}</div>}
      <DataState
        state={tickets}
        loadingMessage="Đang tải phiếu được giao…"
        emptyMessage={isTechnician ? 'Bạn chưa có phiếu được giao' : 'Kỹ thuật viên này chưa có phiếu được giao'}
        onRetry={tickets.reload}
      >
        {(rows) => {
          const p = paginate(rows, page, PAGE_SIZE);
          return (
            <>
              <table className="table">
                <thead><tr><th>Mã phiếu</th><th>Thiết bị</th><th>Mô tả sự cố</th><th>Hạn cam kết ▲</th><th>Lịch hẹn (bắt đầu)</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                <tbody>
                  {p.rows.map((t) => {
                    const action = NEXT_ACTION[t.status];
                    return (
                      <tr key={t.id}>
                        <td><strong>{t.code}</strong></td>
                        <td>{t.deviceModel}</td>
                        <td>{t.issueDescription || '—'}</td>
                        <td className={isOverdue(t.dueDate) && t.status !== 'HOAN_TAT' ? 'overdue' : ''}>{formatShort(t.dueDate)}</td>
                        <td>{formatShort(t.appointmentStart)}</td>
                        <td><StatusBadge status={t.status} /></td>
                        <td>
                          {isTechnician && action
                            ? <button type="button" className="btn btn-dark btn-sm" disabled={busyId === t.id} onClick={() => change(t)}>{action.label}</button>
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Pager page={p.page} pages={p.pages} total={p.total} onChange={setPage} />
            </>
          );
        }}
      </DataState>
      <p className="note">Sắp xếp theo hạn cam kết tăng dần (phiếu sắp quá hạn lên trước) · Phân trang {PAGE_SIZE} dòng (NFR02)</p>
    </section>
  );
}
