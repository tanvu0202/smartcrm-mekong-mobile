// M2 – Phân công kỹ thuật viên và đặt lịch hẹn (US02, US03, US04; UC01, UC03, UC04). Bố cục hai cột theo wireframe:
// trái = thông tin phiếu + đặt lịch hẹn; phải = đề xuất và phân công + đổi kỹ thuật viên. Lịch sử thay đổi ở cuối trang.
import { useState } from 'react';
import { assignTicket, createAppointment, getAppointments, getHistory, getSuggestions, getTicket, reassignTicket } from '../api/tickets.api.js';
import { listTechnicians } from '../api/lookup.api.js';
import { useApi } from '../hooks/useApi.js';
import DataState from '../components/DataState.jsx';
import { StatusBadge } from '../components/Badges.jsx';
import { actionLabel, appointmentLabel, formatDateTime, formatShort, issueLabel, priorityLabel, statusLabel } from '../lib/format.js';
import { toIsoRange, tomorrow } from '../lib/datetime.js';

const RELOAD_CODES = ['TICKET_ALREADY_ASSIGNED', 'TICKET_NOT_ASSIGNED', 'TICKET_CLOSED'];

export default function AssignPage({ ticketId }) {
  const ticket = useApi(() => getTicket(ticketId), [ticketId]);
  const history = useApi(() => getHistory(ticketId), [ticketId]);
  const appointments = useApi(() => getAppointments(ticketId), [ticketId]);
  const centerId = ticket.data?.centerId;
  const technicians = useApi(() => (centerId ? listTechnicians({ centerId }) : Promise.resolve([])), [centerId]);
  const suggestions = useApi(() => getSuggestions(ticketId), [ticketId, ticket.data?.status]);

  const [result, setResult] = useState(null); // { type: 'ok' | 'error' | 'warn', text, warnings }
  const [newTech, setNewTech] = useState(''); // kỹ thuật viên mới chọn từ bảng đề xuất hoặc hộp chọn của khối Đổi kỹ thuật viên
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
      if (err.code === 'TICKET_ALREADY_ASSIGNED') setResult({ type: 'warn', text: 'Phiếu đã được phân công – danh sách được tải lại.' });
      else setResult({ type: 'error', text: err.message });
      if (RELOAD_CODES.includes(err.code)) reloadAll();
      return false;
    }
  }

  return (
    <section>
      <p><a href="#/queue">← Danh sách phiếu</a></p>
      <h1>M2 · Phân công kỹ thuật viên và đặt lịch hẹn</h1>

      <DataState state={ticket} loadingMessage="Đang tải phiếu…" onRetry={ticket.reload}>
        {(t) => (
          <div className="m2">
            <div>
              <div className="card">
                <h2>Thông tin phiếu bảo hành</h2>
                <dl className="kv">
                  <dt>Mã phiếu</dt><dd><strong>{t.code}</strong></dd>
                  <dt>Khách hàng</dt><dd>{t.customerName} · {t.customerPhone}</dd>
                  <dt>Thiết bị</dt><dd>{t.deviceModel}</dd>
                  <dt>Nhóm sự cố</dt><dd>{issueLabel(t.issueGroup)}</dd>
                  <dt>Mô tả sự cố</dt><dd>{t.issueDescription || '—'}</dd>
                  <dt>Mức ưu tiên</dt><dd>{priorityLabel(t.priority).toUpperCase()}</dd>
                  <dt>Hạn cam kết</dt><dd>{formatShort(t.dueDate)}</dd>
                  <dt>Trạng thái</dt><dd><StatusBadge status={t.status} /></dd>
                  <dt>Kỹ thuật viên</dt><dd>{t.technicianId ? nameOf(t.technicianId) : '— (chưa phân công)'}</dd>
                </dl>
              </div>
              <AppointmentCard ticket={t} appointments={appointments} />
            </div>

            <div>
              {result && (
                <div className={`state ${result.type === 'ok' ? 'state-ok' : result.type === 'warn' ? 'state-warn' : 'state-error'}`}
                  role={result.type === 'ok' ? 'status' : 'alert'}>
                  {result.text}
                  {(result.warnings ?? []).map((w) => <div key={w.code} className="warn">⚠ {w.message}</div>)}
                </div>
              )}
              {t.status === 'MOI' && <AssignCard ticket={t} suggestions={suggestions} technicians={technicians} run={run} />}
              {(t.status === 'DA_PHAN_CONG' || t.status === 'DANG_XU_LY') && (
                <>
                  <ReplaceSuggestCard ticket={t} suggestions={suggestions} picked={newTech} onPick={setNewTech} />
                  <ReassignCard ticket={t} technicians={technicians} nameOf={nameOf} run={run} techId={newTech} setTechId={setNewTech} />
                </>
              )}
              {t.status === 'HOAN_TAT' && <div className="state state-empty">Phiếu đã hoàn tất, không thể phân công.</div>}
            </div>
          </div>
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
                    <td>{l.oldTechnicianId && l.oldTechnicianId !== l.newTechnicianId ? `${nameOf(l.oldTechnicianId)} → ` : ''}{nameOf(l.newTechnicianId)}</td>
                    <td>{l.oldStatus && l.oldStatus !== l.newStatus ? `${statusLabel(l.oldStatus)} → ` : ''}{statusLabel(l.newStatus)}</td>
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

/** Đặt lịch hẹn giao – nhận máy (QT-05): trùng khung giờ của kỹ thuật viên thì báo và không lưu. */
function AppointmentCard({ ticket, appointments }) {
  const [form, setForm] = useState({ type: 'GIAO', date: tomorrow(), start: '09:00', end: '10:00' });
  const [msg, setMsg] = useState(null); // { type: 'ok' | 'error', text }
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const blocked = ticket.status === 'MOI' ? 'Hãy phân công kỹ thuật viên trước khi đặt lịch hẹn.'
    : ticket.status === 'HOAN_TAT' ? 'Phiếu đã hoàn tất, không đặt lịch hẹn.' : null;

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    let range;
    try { range = toIsoRange(form.date, form.start, form.end); } catch (err) { setMsg({ type: 'error', text: err.message }); return; }
    setBusy(true);
    try {
      await createAppointment(ticket.id, { type: form.type, ...range });
      setMsg({ type: 'ok', text: 'Đã lưu lịch hẹn.' });
      appointments.reload();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2>Đặt lịch hẹn giao – nhận máy</h2>
      {blocked && <div className="state state-warn">{blocked}</div>}
      <div className="inline">
        <label>Loại
          <select value={form.type} onChange={set('type')} disabled={Boolean(blocked)}>
            <option value="GIAO">Giao</option><option value="NHAN">Nhận</option>
          </select>
        </label>
        <label>Ngày <input type="date" value={form.date} onChange={set('date')} disabled={Boolean(blocked)} /></label>
      </div>
      <div className="inline">
        <label>Bắt đầu <input type="time" value={form.start} onChange={set('start')} disabled={Boolean(blocked)} /></label>
        <label>Kết thúc <input type="time" value={form.end} onChange={set('end')} disabled={Boolean(blocked)} /></label>
      </div>
      <button type="submit" className="btn btn-dark" disabled={Boolean(blocked) || busy}>{busy ? 'Đang lưu…' : 'Đặt lịch hẹn'}</button>
      {msg && <div className={`state ${msg.type === 'ok' ? 'state-ok' : 'state-error'}`} role={msg.type === 'ok' ? 'status' : 'alert'}>{msg.text}</div>}
      <DataState state={appointments} loadingMessage="Đang tải lịch hẹn…" emptyMessage="Phiếu chưa có lịch hẹn" onRetry={appointments.reload}>
        {(list) => (
          <table className="table" aria-label="Lịch hẹn của phiếu">
            <thead><tr><th>Loại</th><th>Bắt đầu</th><th>Kết thúc</th></tr></thead>
            <tbody>{list.map((a) => <tr key={a.id}><td>{appointmentLabel(a.type)}</td><td>{formatDateTime(a.startTime)}</td><td>{formatDateTime(a.endTime)}</td></tr>)}</tbody>
          </table>
        )}
      </DataState>
    </form>
  );
}

/** Đề xuất và phân công: chọn trong đề xuất (QT-03) hoặc "Phân công thủ công"; cảnh báo ≥ 10 phiếu hỏi Có/Không (QT-06, UC01 5a). */
function AssignCard({ ticket, suggestions, technicians, run }) {
  const [chosen, setChosen] = useState('');
  const [manual, setManual] = useState(false);
  const [overloadAsk, setOverloadAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const chosenId = chosen ? Number(chosen) : null;
  const sug = suggestions.data ?? [];
  const noSuggestion = !suggestions.loading && !suggestions.error && sug.length === 0;
  const showManual = manual || noSuggestion;
  const picked = sug.find((s) => s.technicianId === chosenId);
  const pickedName = picked?.fullName ?? technicians.data?.find((t) => t.id === chosenId)?.fullName ?? '';

  async function doAssign() {
    setBusy(true);
    setOverloadAsk(false);
    const ok = await run(() => assignTicket(ticket.id, { technicianId: chosenId }), (r) => `Phân công thành công: phiếu ${r.ticket.code} → ${pickedName}.`);
    setBusy(false);
    if (ok) { setChosen(''); setManual(false); }
  }
  function onConfirm() { if (picked?.overloaded) setOverloadAsk(true); else doAssign(); }
  const choose = (id) => { setChosen(String(id)); setOverloadAsk(false); };

  return (
    <div className="card">
      <h2>Đề xuất và phân công kỹ thuật viên</h2>
      <DataState state={suggestions} loadingMessage="Đang tìm kỹ thuật viên phù hợp…" onRetry={suggestions.reload}
        emptyContent={<div className="state state-warn">Không tìm thấy kỹ thuật viên phù hợp – chọn "Phân công thủ công" hoặc "Hủy".</div>}>
        {(list) => (
          <table className="table">
            <thead><tr><th /><th>Kỹ thuật viên</th><th>Tay nghề (nhóm {issueLabel(ticket.issueGroup)})</th><th>Phiếu đang mở</th></tr></thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.technicianId}>
                  <td><input type="radio" name="tech" aria-label={`Chọn ${s.fullName}`} checked={chosenId === s.technicianId} onChange={() => choose(s.technicianId)} /></td>
                  <td>{s.fullName}<div className="muted small">{s.phone}</div></td>
                  <td>{s.proficiency}</td>
                  <td>{s.openTickets} {s.overloaded && <span className="badge st-warn">Quá tải</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DataState>

      {showManual && (
        <div className="row">
          <label>Chọn thủ công trong trung tâm
            <select value={chosen} onChange={(e) => choose(e.target.value)}>
              <option value="">— chọn kỹ thuật viên —</option>
              {(technicians.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </select>
          </label>
        </div>
      )}

      {overloadAsk && (
        <div className="state state-warn" role="alertdialog" aria-label="Cảnh báo quá tải">
          Kỹ thuật viên đang có nhiều phiếu (≥ 10), bạn có muốn tiếp tục?
          <div className="row">
            <button type="button" className="btn btn-dark btn-sm" disabled={busy} onClick={doAssign}>Có</button>
            <button type="button" className="btn btn-sm" onClick={() => setOverloadAsk(false)}>Không</button>
          </div>
        </div>
      )}

      <div className="row">
        <button type="button" className="btn btn-dark" disabled={!chosenId || busy} onClick={onConfirm}>{busy ? 'Đang lưu…' : 'Xác nhận phân công'}</button>
        <button type="button" className="btn" onClick={() => setManual(!manual)}>{showManual && !noSuggestion ? 'Hủy phân công thủ công' : 'Phân công thủ công'}</button>
      </div>
    </div>
  );
}

/** Phiếu đã có kỹ thuật viên: vẫn hiện bảng đề xuất (QT-03, bỏ người đang phụ trách); chọn một dòng sẽ điền vào ô "Kỹ thuật viên mới" bên dưới. */
function ReplaceSuggestCard({ ticket, suggestions, picked, onPick }) {
  const list = (suggestions.data ?? []).filter((s) => s.technicianId !== ticket.technicianId);
  return (
    <div className="card">
      <h2>Đề xuất kỹ thuật viên thay thế</h2>
      <DataState state={suggestions} loadingMessage="Đang tìm kỹ thuật viên phù hợp…" onRetry={suggestions.reload}
        isEmpty={() => list.length === 0}
        emptyContent={<div className="state state-warn">Không có kỹ thuật viên phù hợp khác – chọn trong ô "Kỹ thuật viên mới" bên dưới.</div>}>
        {() => (
          <table className="table">
            <thead><tr><th /><th>Kỹ thuật viên</th><th>Tay nghề (nhóm {issueLabel(ticket.issueGroup)})</th><th>Phiếu đang mở</th></tr></thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.technicianId}>
                  <td><input type="radio" name="replace-tech" aria-label={`Chọn ${s.fullName} làm kỹ thuật viên mới`}
                    checked={String(s.technicianId) === picked} onChange={() => onPick(String(s.technicianId))} /></td>
                  <td>{s.fullName}<div className="muted small">{s.phone}</div></td>
                  <td>{s.proficiency}</td>
                  <td>{s.openTickets} {s.overloaded && <span className="badge st-warn">Quá tải</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DataState>
    </div>
  );
}

/** Đổi kỹ thuật viên: bắt buộc lý do (QT-04); phiếu "Đang xử lý" phải bấm xác nhận trước khi đổi. */
function ReassignCard({ ticket, technicians, nameOf, run, techId, setTechId }) {
  const [reason, setReason] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [hint, setHint] = useState(null);
  const [busy, setBusy] = useState(false);
  const inProgress = ticket.status === 'DANG_XU_LY';
  const options = (technicians.data ?? []).filter((t) => t.id !== ticket.technicianId);

  async function submit(e) {
    e.preventDefault();
    setHint(null);
    if (!techId) { setHint('Vui lòng chọn kỹ thuật viên mới.'); return; }
    if (!reason.trim()) { setHint('Vui lòng nhập lý do đổi kỹ thuật viên.'); return; }
    if (inProgress && !confirm) { setHint('Phiếu đang xử lý – hãy bấm Xác nhận trước khi đổi.'); return; }
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
      <dl className="kv"><dt>Hiện tại</dt><dd>{nameOf(ticket.technicianId)}</dd></dl>
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
        <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ví dụ: KTV cũ nghỉ ốm" />
      </label>
      {inProgress && (
        <div className="state state-warn">
          Phiếu đang ở trạng thái "Đang xử lý" – xác nhận trước khi đổi?
          <div className="row">
            <button type="button" className="btn btn-sm" aria-pressed={confirm} onClick={() => setConfirm(!confirm)}>{confirm ? '✓ Đã xác nhận' : 'Xác nhận'}</button>
          </div>
        </div>
      )}
      {hint && <div className="state state-error" role="alert">{hint}</div>}
      <button type="submit" className="btn btn-dark" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu'}</button>
    </form>
  );
}
