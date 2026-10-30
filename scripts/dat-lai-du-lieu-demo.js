// Đưa dữ liệu THỬ về trạng thái ban đầu để chụp giao diện: xóa mọi lịch hẹn, lịch sử và phiếu do các lần chạy thử tạo ra,
// trả 3 phiếu mẫu BH-0001..BH-0003 về "Mới", chưa có kỹ thuật viên. Danh mục trung tâm / kỹ thuật viên giữ nguyên.
// CHỈ dùng cho CSDL thử của em. Phải thêm --yes thì mới chạy:   node scripts/dat-lai-du-lieu-demo.js --yes
require('dotenv').config();
const { pool } = require('../src/backend/src/db');

(async () => {
  if (!process.argv.includes('--yes')) {
    console.log('Lệnh này XÓA các phiếu / lịch hẹn / lịch sử thử (trừ BH-0001..BH-0003) trong database đang cấu hình ở .env.');
    console.log('Đúng ý em thì chạy lại:  node scripts/dat-lai-du-lieu-demo.js --yes');
    await pool.end(); return;
  }
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    await c.query('DELETE FROM appointment');
    await c.query('DELETE FROM ticket_log');
    await c.query("DELETE FROM ticket WHERE ticket_code NOT IN ('BH-0001','BH-0002','BH-0003')");
    await c.query("UPDATE ticket SET technician_id = NULL, status = 'MOI' WHERE ticket_code IN ('BH-0001','BH-0002','BH-0003')");
    await c.query('COMMIT');
    const { rows } = await c.query("SELECT ticket_code, status FROM ticket ORDER BY ticket_code");
    console.log('Đã đặt lại dữ liệu thử. Phiếu hiện có:', rows.map((r) => `${r.ticket_code} (${r.status})`).join(', '));
  } catch (e) {
    await c.query('ROLLBACK'); console.error('Không đặt lại được:', e.message); process.exitCode = 1;
  } finally { c.release(); await pool.end(); }
})();
