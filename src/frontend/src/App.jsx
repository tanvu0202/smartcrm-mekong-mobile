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

  const isManager = user.role === 'QUAN_LY';
  const onTicket = route.name === 'ticket';
  return (
    <>
      <header className="topbar">
        <strong>Mekong Mobile · Bảo hành</strong>
        <span className="who">{isManager ? 'Quản lý trung tâm' : 'Kỹ thuật viên'} · {user.fullName}
          <button type="button" className="btn btn-sm" onClick={onLogout}>Đăng xuất</button></span>
      </header>
      <nav className="tabs" aria-label="Màn hình">
        {isManager && <a href="#/queue" className={`tab ${route.name === 'queue' ? 'active' : ''}`}>M1 Phiếu chờ phân công</a>}
        {isManager && (onTicket
          ? <span className="tab active">M2 Phân công &amp; lịch hẹn</span>
          : <span className="tab disabled" title="Chọn một phiếu ở M1 để mở">M2 Phân công &amp; lịch hẹn</span>)}
        <a href="#/my" className={`tab ${route.name === 'my' ? 'active' : ''}`}>{isManager ? 'M3 Phiếu theo kỹ thuật viên' : 'M3 Phiếu của tôi'}</a>
      </nav>
      <main className="page">
        <div className="frame">
          {route.name === 'queue' && isManager && <TicketQueuePage />}
          {route.name === 'ticket' && isManager && <AssignPage key={route.params.id} ticketId={Number(route.params.id)} />}
          {route.name === 'my' && <MyTicketsPage user={user} />}
        </div>
      </main>
    </>
  );
}
