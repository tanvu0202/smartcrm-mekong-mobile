// Tài khoản demo của Sprint 2. SRS (mục 1.5) coi tài khoản là "dịch vụ xác thực có sẵn, ngoài phạm vi";
// đây là bản thay thế tối thiểu để giao diện có luồng đăng nhập – xem TD-14. Không có bảng tài khoản trong CSDL (ERD BT1 giữ nguyên).
const crypto = require('node:crypto');

const DEMO_ACCOUNTS = [
  { username: 'dieu.phoi', fullName: 'Điều phối viên', role: 'QUAN_LY' },
  { username: 'ktv.hai', fullName: 'Nguyễn Hải', role: 'KTV', technicianPhone: '0901000002' },
  { username: 'ktv.long', fullName: 'Trần Long', role: 'KTV', technicianPhone: '0901000003' },
];

const hashPassword = (password, salt) => crypto.scryptSync(password, salt, 32);

/** Băm mật khẩu một lần khi khởi động; trong bộ nhớ chỉ giữ muối + băm, không giữ mật khẩu gốc. */
function buildUsers(definitions, password) {
  return definitions.map((d) => {
    const salt = crypto.randomBytes(16);
    return { ...d, salt, hash: hashPassword(password, salt) };
  });
}

/** So sánh thời gian cố định. user có thể là undefined: vẫn băm để thời gian phản hồi không lộ tên đăng nhập có tồn tại hay không. */
function verifyPassword(user, password) {
  const salt = user ? user.salt : Buffer.alloc(16);
  const actual = hashPassword(String(password), salt);
  return Boolean(user) && crypto.timingSafeEqual(actual, user.hash);
}

module.exports = { DEMO_ACCOUNTS, buildUsers, verifyPassword };
