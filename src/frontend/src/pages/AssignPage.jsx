// M2 – Chi tiết phiếu, đề xuất và phân công / đổi kỹ thuật viên (US02, US03; UC01, UC03).
import { useState } from 'react';
import { assignTicket, getHistory, getSuggestions, getTicket, reassignTicket } from '../api/tickets.api.js';
import { listTechnicians } from '../api/lookup.api.js';
import { useApi } from '../hooks/useApi.js';
import DataState from '../components/DataState.jsx';
import { PriorityBadge, StatusBadge } from '../components/Badges.jsx';
import { actionLabel, formatDateTime, issueLabel, statusLabel } from '../lib/format.js';

export default function AssignPage({ ticketId }) {
  const ticket = useApi(() => getTicket(ticketId), [ticketId]);
  const history = useApi(() => getHistory(ticketId), [ticketId]);
  const centerId = ticket.data?.centerId;
  const technicians = useApi(() => (centerId ? listTechnicians({ centerId }) : Promise.resolve([])), [centerId]);
  const suggestions = useApi(() => getSuggestions(ticketId), [ticketId, ticket.data?.status]);

  const [result, setResult] = useState(null); // { type: 'ok' | 'error', text, warnings }
  const reloadAll = () => { ticket.reload(); history.reload(); suggestions.reload(); };
  const nameOf = (id) => (id == null ? '—' : technicians.data?.find((t) => t.id === id)?.fullName ?? `KTV #${id}`);

  /** Sau mỗi thao tác: thành công → làm mới; lỗi → hiện thông báo, và nếu phiếu đã bị người khác đổi thì tải lại. */
  async function run(action, okText) {
    setResult(null);
    try {
      const res = await action();
      setResult({ type: 'ok', text: okText(res), warnings: res.warnings });
      reloadAll();
      return true;
    } catch (err) {
      setResult({ type: 'error', text: err.message });
      if (['TICKET_ALREADY_ASSIGNED', 'TICKET_NOT_ASSIGNED', 'TICKET_CLOSED'].includes(err.code)) reloadAll();
      return false;
    }
  }

  return (
    <section>
      <p><a href="#/queue">← Danh sách phiếu</a></p>
      <h1>Chi tiết và phân công phiếu</h1>

      <DataState state={ticket} loadingMessage="Đang tải phiếu…" onRetry={ticket.reload}>
        {(t) => (
          <>
            <div className="card">
              <h2>{t.code} <StatusBadge status={t.status} /> <PriorityBadge priority={t.priority} /></h2>
              <dl className="details">
                <dt>Khách hàng</dt><dd>{t.customerName} · {t.customerPhone}</dd>
                <dt>Thiết bị</dt><dd>{t.deviceModel}</dd>
                <dt>Nhóm sự cố</dt><dd>{issueLabel(t.issueGroup)}</dd>
                <dt>Mô tả</dt><dd>{t.issueDescription || '—'}</dd>
                <dt>Hạn cam kết</dt><dd>{formatDateTime(t.dueDate)}</dd>
                <dt>Kỹ thuật viên</dt><dd>{t.technicianId ? nameOf(t.technicianId) : 'Chưa phân công'}</dd>
              </dl>
            </div>

            {result && (
              <div className={`state ${result.type === 'ok' ? 'state-ok' : 'state-error'}`} role={result.type === 'ok' ? 'status' : 'alert'}>
                {result.text}
                {(result.warnings ?? []).map((w) => <div key={w.code} className="warn">⚠ {w.message}</div>)}
              </div>
            )}

            {t.status === 'MOI' && (
              <AssignCard ticket={t} suggestions={suggestions} technicians={technicians} run={run} />
            )}
            {(t.status === 'DA_PHAN_CONG' || t.status === 'DANG_XU_LY') && (
              <ReassignCard ticket={t} technicians={technicians} run={run} />
            )}
            {t.status === 'HOAN_TAT' && <div className="state state-empty">Phiếu đã hoàn tất, không thể phân công.</div>}
          </>
        )}
      </DataState>

      <div className="card">
        <h2>Lịch sử thay đổi</h2>
        <DataState state={history} loadingMessage="Đang tải lịch sử…" emptyMessage="Chưa có thay đổi nào" onRetry={history.reload}>
          {(logs) => (
            <table className="table">
              <thead><tr><th>Thời gian</th><th>Thao tác</th><th>Kỹ thuật viên</th><th>Trạng thái</th><th>Người thực hiện</th><th>Lý do</th></tr></thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td>{formatDateTime(l.changedAt)}</td>
                    <td>{actionLabel(l.action)}</td>
                    <td>{l.oldTechnicianId ? `${nameOf(l.oldTechnicianId)} → ` : ''}{nameOf(l.newTechnicianId)}</td>
                    <td>{l.oldStatus ? `${statusLabel(l.oldStatus)} → ` : ''}{statusLabel(l.newStatus)}</td>
                    <td>{l.changedBy}</td>
                    <td>{l.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DataState>
      </div>
    </section>
  );
}

/** Phân công lần đầu: chọn trong danh sách đề xuất (cùng trung tâm, tay nghề ≥ 3) hoặc chọn thủ công khi không có đề xuất. */
function AssignCard({ ticket, suggestions, technicians, run }) {
  const [chosen, setChosen] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const chosenId = chosen ? Number(chosen) : null;
  const manualOptions = (technicians.data ?? []).filter((t) => !suggestions.data?.some((s) => s.technicianId === t.id));
  const chosenName = (suggestions.data?.find((s) => s.technicianId === chosenId)?.fullName)
    ?? technicians.data?.find((t) => t.id === chosenId)?.fullName ?? '';

  async function confirm() {
    setBusy(true);
    const ok = await run(() => assignTicket(ticket.id, { technicianId: chosenId }), (r) => `Đã phân công phiếu ${r.ticket.code} cho ${chosenName}.`);
    setBusy(false);
    if (ok) { setConfirming(false); setChosen(''); }
  }

  const picker = (
    <>
      <label>Chọn thủ công trong trung tâm
        <select value={chosen} onChange={(e) => { setChosen(e.target.value); setConfirming(false); }}>
          <option value="">— chọn kỹ thuật viên —</option>
          {manualOptions.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
        </select>
      </label>
    </>
  );

  return (
    <div className="card">
      <h2>Phân công kỹ thuật viên</h2>
      <p className="muted small">Đề xuất: cùng trung tâm, tay nghề ≥ 3 với nhóm sự cố, ít phiếu đang mở trước.</p>
      <DataState
        state={suggestions}
        loadingMessage="Đang tìm kỹ thuật viên phù hợp…"
        onRetry={suggestions.reload}
        emptyContent={<div><div className="state state-empty">Không tìm thấy kỹ thuật viên phù hợp. Hãy chọn thủ công.</div>{picker}</div>}
      >
        {(list) => (
          <>
            <table className="table">
              <thead><tr><th /><th>Kỹ thuật viên</th><th>Tay nghề</th><th>Phiếu đang mở</th><th /></tr></thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.technicianId}>
                    <td><input type="radio" name="tech" aria-label={`Chọn ${s.fullName}`} checked={chosenId === s.technicianId}
                      onChange={() => { setChosen(String(s.technicianId)); setConfirming(false); }} /></td>
                    <td>{s.fullName}<div className="muted small">{s.phone}</div></td>
                    <td>{s.proficiency}/5</td>
                    <td>{s.openTickets}</td>
                    <td>{s.overloaded && <span className="badge st-warn">Đang quá tải</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {picker}
          </>
        )}
      </DataState>

      {!confirming ? (
        <button type="button" className="btn btn-primary" disabled={!chosenId} onClick={() => setConfirming(true)}>Phân công</button>
      ) : (
        <div className="confirm" role="group" aria-label="Xác nhận phân công">
          <span>Xác nhận phân công phiếu <strong>{ticket.code}</strong> cho <strong>{chosenName}</strong>?</span>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={confirm}>{busy ? 'Đang lưu…' : 'Xác nhận'}</button>
          <button type="button" className="btn" disabled={busy} onClick={() => setConfirming(false)}>Hủy</button>
        </div>
      )}
    </div>
  );
}

/** Đổi kỹ thuật viên: bắt buộc lý do (QT-04); phiếu "Đang xử lý" phải tích xác nhận. */
function ReassignCard({ ticket, technicians, run }) {
  const [techId, setTechId] = useState('');
  const [reason, setReason] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const inProgress = ticket.status === 'DANG_XU_LY';
  const options = (technicians.data ?? []).filter((t) => t.id !== ticket.technicianId);
  const ready = techId && reason.trim() && (!inProgress || confirm);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const name = options.find((t) => t.id === Number(techId))?.fullName ?? '';
    const ok = await run(
      () => reassignTicket(ticket.id, { technicianId: Number(techId), reason: reason.trim(), confirm: inProgress ? confirm : undefined }),
      (r) => `Đã đổi kỹ thuật viên của phiếu ${r.ticket.code} sang ${name}.`,
    );
    setBusy(false);
    if (ok) { setTechId(''); setReason(''); setConfirm(false); }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2>Đổi kỹ thuật viên</h2>
      <DataState state={technicians} loadingMessage="Đang tải danh sách kỹ thuật viên…" emptyMessage="Không có kỹ thuật viên khác trong trung tâm" onRetry={technicians.reload}>
        {() => (
          <label>Kỹ thuật viên mới
            <select value={techId} onChange={(e) => setTechId(e.target.value)}>
              <option value="">— chọn kỹ thuật viên —</option>
              {options.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </select>
          </label>
        )}
      </DataState>
      <label>Lý do đổi (bắt buộc)
        <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ví dụ: KTV cũ nghỉ ốm" />
      </label>
      {inProgress && (
        <label className="check">
          <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
          Phiếu đang xử lý – tôi xác nhận vẫn đổi kỹ thuật viên
        </label>
      )}
      <button type="submit" className="btn btn-primary" disabled={!ready || busy}>{busy ? 'Đang lưu…' : 'Đổi kỹ thuật viên'}</button>
    </form>
  );
}
