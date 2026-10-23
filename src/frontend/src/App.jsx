import { useEffect, useState } from 'react';
import { setUnauthorizedHandler } from './api/client.js';
import { currentUser, hasSession, logout } from './api/auth.api.js';
import { homeFor, matchRoute } from './lib/router.js';
import LoginPage from './pages/LoginPage.jsx';
import TicketQueuePage from './pages/TicketQueuePage.jsx';
import AssignPage from './pages/AssignPage.jsx';
import MyTicketsPage from './pages/MyTicketsPage.jsx';

export default function App() {
  const [hash, setHash] = useState(window.location.hash);
  const [user, setUser] = useState(() => (hasSession() ? currentUser() : null));
  const [notice, setNotice] = useState(null);
  const route = matchRoute(hash);

  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Nhận 401 ở bất kỳ lời gọi API nào: client đã xoá token → ở đây xoá người dùng và về trang đăng nhập.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setNotice('Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.');
      window.location.hash = '#/login';
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Điều hướng theo trạng thái đăng nhập và vai trò
  useEffect(() => {
    if (!user) { if (route.name !== 'login') window.location.hash = '#/login'; return; }
    const managerOnly = route.name === 'queue' || route.name === 'ticket';
    if (route.name === 'login' || route.name === 'notfound' || (user.role === 'KTV' && managerOnly)) {
      window.location.hash = homeFor(user.role);
    }
  }, [user, route.name]);

  function onLoggedIn(u) { setNotice(null); setUser(u); window.location.hash = homeFor(u.role); }
  function onLogout() { logout(); setUser(null); setNotice(null); window.location.hash = '#/login'; }

  if (!user) return <LoginPage notice={notice} onLoggedIn={onLoggedIn} />;

  return (
    <>
      <header className="topbar">
        <strong>Mekong Mobile · Phân công kỹ thuật viên</strong>
        <nav>
          {user.role === 'QUAN_LY' && <a href="#/queue" className={route.name === 'queue' || route.name === 'ticket' ? 'active' : ''}>Danh sách phiếu</a>}
          <a href="#/my" className={route.name === 'my' ? 'active' : ''}>{user.role === 'KTV' ? 'Phiếu của tôi' : 'Phiếu theo KTV'}</a>
        </nav>
        <span className="who">{user.fullName} ({user.role === 'KTV' ? 'Kỹ thuật viên' : 'Quản lý'})
          <button type="button" className="btn" onClick={onLogout}>Đăng xuất</button></span>
      </header>
      <main className="page">
        {route.name === 'queue' && user.role === 'QUAN_LY' && <TicketQueuePage />}
        {route.name === 'ticket' && user.role === 'QUAN_LY' && <AssignPage key={route.params.id} ticketId={Number(route.params.id)} />}
        {route.name === 'my' && <MyTicketsPage user={user} />}
      </main>
    </>
  );
}
