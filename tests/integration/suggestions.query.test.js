// Kiểm thử câu truy vấn đề xuất kỹ thuật viên (technicianRepository.findCandidates) trên PostgreSQL thật.
// Quy tắc: QT-03 cùng trung tâm, tay nghề ≥ 3 với đúng nhóm sự cố; chỉ KTV đang hoạt động; kèm số phiếu mở.
const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');

test('findCandidates: cùng trung tâm, tay nghề ≥ 3, đúng nhóm sự cố, đang hoạt động', { skip: !h.enabled && 'cần TEST_DATABASE_URL' }, async (t) => {
  const { pool, technicianRepo, service } = h.load();
  const c1 = await h.makeCenter(pool, 'A');
  const c2 = await h.makeCenter(pool, 'B');
  t.after(async () => { await h.cleanup(pool, c1); await h.cleanup(pool, c2); await pool.end(); });

  const skill5 = await h.makeTech(pool, c1, { skills: { MAN_HINH: 5 } });
  const skill3 = await h.makeTech(pool, c1, { skills: { MAN_HINH: 3 } });          // đúng ngưỡng 3 -> được chọn
  await h.makeTech(pool, c1, { skills: { MAN_HINH: 2 } });                          // 2 < 3 -> loại
  await h.makeTech(pool, c1, { skills: { PIN: 5 } });                                // sai nhóm sự cố -> loại
  await h.makeTech(pool, c1, { skills: { MAN_HINH: 5 }, active: false });           // ngừng hoạt động -> loại
  await h.makeTech(pool, c2, { skills: { MAN_HINH: 5 } });                           // khác trung tâm -> loại

  const rows = await technicianRepo.findCandidates(pool, { centerId: c1, issueGroup: 'MAN_HINH', minProficiency: 3 });
  assert.deepEqual(rows.map((r) => r.technician_id), [skill5, skill3], 'chỉ 2 KTV, tay nghề cao xếp trước');
  assert.ok(rows.every((r) => r.proficiency >= 3));

  // Khi KTV skill5 có phiếu mở thì open_tickets tăng; phiếu HOAN_TAT không tính.
  const t1 = await service.create(h.ticketInput(c1));
  await service.assign(t1.ticket_id, { technicianId: skill5, changedBy: 'test' });
  const after = await technicianRepo.findCandidates(pool, { centerId: c1, issueGroup: 'MAN_HINH', minProficiency: 3 });
  assert.equal(after.find((r) => r.technician_id === skill5).open_tickets, 1);
  assert.equal(after.find((r) => r.technician_id === skill3).open_tickets, 0);

  // Service đánh dấu overloaded theo ngưỡng (ở đây 1 phiếu < 10 nên false)
  const sug = await service.suggest(t1.ticket_id);
  assert.ok(sug.every((r) => r.overloaded === false));
});

test('findCandidates: không có KTV phù hợp trả mảng rỗng (ngoại lệ 4a UC01)', { skip: !h.enabled && 'cần TEST_DATABASE_URL' }, async (t) => {
  const { pool, technicianRepo } = h.load();
  const c = await h.makeCenter(pool, 'EMPTY');
  t.after(async () => { await h.cleanup(pool, c); await pool.end(); });
  await h.makeTech(pool, c, { skills: { MAN_HINH: 2 } });
  assert.deepEqual(await technicianRepo.findCandidates(pool, { centerId: c, issueGroup: 'MAN_HINH', minProficiency: 3 }), []);
});
