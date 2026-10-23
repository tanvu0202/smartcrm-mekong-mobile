// M1 – Danh sách phiếu chờ phân công (US01, US06): thẻ tổng quan, bộ lọc Trung tâm / Mức ưu tiên / Trạng thái, bảng phân trang 20 dòng.
import { useState } from 'react';
import { listTickets } from '../api/tickets.api.js';
import { listCenters, listTechnicians } from '../api/lookup.api.js';
import { useApi } from '../hooks/useApi.js';
import DataState from '../components/DataState.jsx';
import Pager from '../components/Pager.jsx';
import { PriorityBadge, StatusBadge } from '../components/Badges.jsx';
import { PRIORITY_LABEL, STATUS_LABEL, formatShort, isOverdue, issueLabel } from '../lib/format.js';
import { computeOverview } from '../lib/overview.js';
import { paginate } from '../lib/paginate.js';

const PAGE_SIZE = 20;

export default function TicketQueuePage() {
  const [draft, setDraft] = useState({ centerId: '', priority: '', status: 'MOI' });
  const [applied, setApplied] = useState(draft);
  const [page, setPage] = useState(1);
  const [stamp, setStamp] = useState(0);
  const centers = useApi(listCenters, []);
  const overview = useApi(async () => {
    const [all, techs] = await Promise.all([listTickets({}), listTechnicians()]);
    return computeOverview(all, techs, Date.now());
  }, [stamp]);
  const tickets = useApi(async () => {
    const rows = await listTickets({ status: applied.status, centerId: applied.centerId });
    return applied.priority ? rows.filter((t) => String(t.priority) === applied.priority) : rows;
  }, [applied, stamp]);
  const set = (k) => (e) => setDraft({ ...draft, [k]: e.target.value });

  function submit(e) {
    e.preventDefault();
    setApplied(draft);
    setPage(1);
    setStamp((n) => n + 1);
  }

  return (
    <section>
      <h1>M1 · Danh sách phiếu chờ phân công</h1>

      <DataState state={overview} loadingMessage="Đang tải số liệu tổng quan…" onRetry={overview.reload}
        isEmpty={() => false}>
        {(o) => (
          <div className="cards3">
            <div className="card stat"><span>Phiếu phát sinh hôm nay</span><strong>{o.createdToday}</strong></div>
            <div className="card stat red"><span>Phiếu quá hạn hoặc còn ≤ 4 giờ</span><strong>{o.dueSoon}</strong></div>
            <div className="card stat">
              <span>Số phiếu đang mở của từng kỹ thuật viên</span>
              <div>
                {o.perTechnician.length === 0 && '—'}
                {o.perTechnician.map((k, i) => (
                  <span key={k.id}>{i > 0 && ' · '}{k.name}: <span className={k.open >= 10 ? 'over' : ''}>{k.open}</span></span>
                ))}
              </div>
            </div>
          </div>
        )}
      </DataState>

      <form className="filters" onSubmit={submit}>
        <label>Trung tâm
          <select value={draft.centerId} onChange={set('centerId')} disabled={!centers.data}>
            <option value="">Tất cả</option>
            {(centers.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label>Mức ưu tiên
          <select value={draft.priority} onChange={set('priority')}>
            <option value="">Tất cả</option>
            {Object.entries(PRIORITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>Trạng thái
          <select value={draft.status} onChange={set('status')}>
            <option value="">Tất cả</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <button type="submit" className="btn btn-dark">Lọc</button>
        <button type="button" className="btn" onClick={() => setStamp((n) => n + 1)}>Tải lại</button>
      </form>

      <DataState
        state={tickets}
        loadingMessage="Đang tải danh sách phiếu…"
        emptyMessage={applied.status === 'MOI' && !applied.centerId && !applied.priority ? 'Không có phiếu chờ phân công' : 'Không có phiếu nào khớp bộ lọc'}
        onRetry={tickets.reload}
      >
        {(rows) => {
          const p = paginate(rows, page, PAGE_SIZE);
          return (
            <>
              <table className="table">
                <thead>
                  <tr><th>Mã phiếu</th><th>Khách hàng</th><th>Thiết bị</th><th>Nhóm sự cố</th><th>Mức ưu tiên</th><th>Hạn cam kết</th><th>Trạng thái</th><th>Thao tác</th></tr>
                </thead>
                <tbody>
                  {p.rows.map((t) => (
                    <tr key={t.id}>
                      <td><strong>{t.code}</strong></td>
                      <td>{t.customerName}</td>
                      <td>{t.deviceModel}</td>
                      <td>{issueLabel(t.issueGroup)}</td>
                      <td><PriorityBadge priority={t.priority} /></td>
                      <td className={isOverdue(t.dueDate) && t.status !== 'HOAN_TAT' ? 'overdue' : ''}>{formatShort(t.dueDate)}</td>
                      <td><StatusBadge status={t.status} /></td>
                      <td><a className="btn btn-dark btn-sm" href={`#/tickets/${t.id}`}>{t.status === 'MOI' ? 'Phân công' : 'Xem'}</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pager page={p.page} pages={p.pages} total={p.total} onChange={setPage} />
            </>
          );
        }}
      </DataState>
      <p className="note">Sắp xếp: mức ưu tiên Cao → Trung bình → Thấp; cùng mức thì hạn cam kết gần nhất lên trước · Phân trang {PAGE_SIZE} dòng</p>
    </section>
  );
}
