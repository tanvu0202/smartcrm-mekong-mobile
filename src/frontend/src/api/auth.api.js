import { post, get, session } from './client.js';

/** Đăng nhập; thành công thì lưu token + thông tin người dùng, trả về user. */
export async function login(username, password) {
  const res = await post('/auth/login', { username, password }, { auth: false });
  session.save(res.token, res.user);
  return res.user;
}

export const logout = () => session.clear();
export const currentUser = () => session.getUser();
export const hasSession = () => Boolean(session.getToken());
export const fetchMe = async () => (await get('/auth/me')).user;
