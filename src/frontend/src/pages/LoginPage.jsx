// Đăng nhập (TD-14). Có ba nút tài khoản demo: bấm một lần là điền và đăng nhập luôn.
import { useState } from 'react';
import { login } from '../api/auth.api.js';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../lib/demoAccounts.js';

export default function LoginPage({ notice, onLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function signIn(u, p) {
    setBusy(true);
    setError(null);
    try {
      onLoggedIn(await login(u, p));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function submit(e) {
    e.preventDefault();
    signIn(username, password);
  }

  function quick(account) {
    setUsername(account.username);
    setPassword(DEMO_PASSWORD);
    signIn(account.username, DEMO_PASSWORD);
  }

  return (
    <main className="login">
      <h1>Đăng nhập</h1>
      <p className="muted">Mekong Mobile – phân công kỹ thuật viên (luồng L4)</p>
      {notice && <div className="state state-error" role="alert">{notice}</div>}
      <form onSubmit={submit} className="card">
        <label>Tên đăng nhập
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus />
        </label>
        <label>Mật khẩu
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </label>
        {error && <div className="state state-error" role="alert">{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
      </form>

      <section className="card demo" aria-label="Tài khoản demo">
        <h2>Tài khoản demo – bấm để đăng nhập ngay</h2>
        <div className="demo-list">
          {DEMO_ACCOUNTS.map((a) => (
            <button key={a.username} type="button" className="demo-item" disabled={busy} onClick={() => quick(a)}>
              <strong>{a.fullName}</strong>
              <span>{a.roleLabel}</span>
              <code>{a.username}</code>
              <small>{a.hint}</small>
            </button>
          ))}
        </div>
        <p className="muted small">Mật khẩu demo mặc định <code>{DEMO_PASSWORD}</code> (đổi bằng <code>DEMO_PASSWORD</code> trong .env của backend; nếu đã đổi thì nhập tay ở form trên).</p>
      </section>
    </main>
  );
}
