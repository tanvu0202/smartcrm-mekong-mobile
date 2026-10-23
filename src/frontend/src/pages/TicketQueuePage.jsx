// M1 – Danh sách phiếu (US01): mặc định phiếu chờ phân công, lọc theo trạng thái và trung tâm.
import { useState } from 'react';
import { listTickets } from '../api/tickets.api.js';
import { listCenters } from '../api/lookup.api.js';
import { useApi } from '../hooks/useApi.js';
import DataState from '../components/DataState.jsx';
import { PriorityBadge, StatusBadge } from '../components/Badges.jsx';
import { STATUS_LABEL, formatDateTime, isOverdue, issueLabel } from '../lib/format.js';

export default function TicketQueuePage() {
  const [status, setStatus] = useState('MOI');
  const [centerId, setCenterId] = useState('');
  const centers = useApi(listCenters, []);
  const tickets = useApi(() => listTickets({ status, centerId }), [status, centerId]);
  const centerName = (id) => centers.data?.find((c) => c.id === id)?.name ?? `Trung tâm #${id}`;

  return (
    <section>
      <h1>Danh sách phiếu bảo hành</h1>
      <div className="filters">
        <label>Trạng thái
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tất cả</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>Trung tâm
          <select value={centerId} onChange={(e) => setCenterId(e.target.value)} disabled={!centers.data}>
            <option value="">Tất cả</option>
            {(centers.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <button type="button" className="btn" onClick={tickets.reload}>Tải lại</button>
      </div>

      <DataState
        state={tickets}
        loadingMessage="Đang tải danh sách phiếu…"
        emptyMessage={status === 'MOI' ? 'Không có phiếu chờ phân công' : 'Không có phiếu nào khớp bộ lọc'}
        onRetry={tickets.reload}
      >
        {(rows) => (
          <table className="table">
            <thead>
              <tr><th>Mã phiếu</th><th>Khách hàng</th><th>Thiết bị</th><th>Nhóm sự cố</th><th>Trung tâm</th><th>Ưu tiên</th><th>Hạn cam kết</th><th>Trạng thái</th><th /></tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td><strong>{t.code}</strong></td>
                  <td>{t.customerName}<div className="muted small">{t.customerPhone}</div></td>
                  <td>{t.deviceModel}</td>
                  <td>{issueLabel(t.issueGroup)}</td>
                  <td>{centerName(t.centerId)}</td>
                  <td><PriorityBadge priority={t.priority} /></td>
                  <td className={isOverdue(t.dueDate) && t.status !== 'HOAN_TAT' ? 'overdue' : ''}>{formatDateTime(t.dueDate)}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td><a className="btn btn-primary" href={`#/tickets/${t.id}`}>{t.status === 'MOI' ? 'Phân công' : 'Xem'}</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DataState>
    </section>
  );
}
