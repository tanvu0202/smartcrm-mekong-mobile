import { useState } from 'react';
import { login } from '../api/auth.api.js';

export default function LoginPage({ notice, onLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onLoggedIn(await login(username, password));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
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
      <p className="muted small">Tài khoản demo: <code>dieu.phoi</code> (quản lý), <code>ktv.hai</code>, <code>ktv.long</code> (kỹ thuật viên); mật khẩu theo <code>DEMO_PASSWORD</code> trong .env của backend (mặc định <code>demo123</code>).</p>
    </main>
  );
}
