-- db/migrations/002_seed_catalog.sql
-- Dữ liệu danh mục và dữ liệu thử cho Sprint 1. Chạy lại nhiều lần vẫn an toàn (ON CONFLICT DO NOTHING).
-- Lưu ý: tiếp nhận phiếu thuộc luồng L2 (ngoài phạm vi); 3 phiếu dưới đây chỉ là dữ liệu thử cho L4.

INSERT INTO service_center (name, address, phone) VALUES
  ('Trung tâm Quận 1',  '12 Nguyễn Huệ, Quận 1, TP.HCM',         '02838000001'),
  ('Trung tâm Quận 10', '85 Sư Vạn Hạnh, Quận 10, TP.HCM',       '02838000010')
ON CONFLICT (name) DO NOTHING;

INSERT INTO technician (center_id, full_name, phone)
SELECT c.center_id, v.full_name, v.phone
FROM (VALUES
  ('Trung tâm Quận 1',  'Lê Phúc',        '0901000001'),
  ('Trung tâm Quận 1',  'Nguyễn Hải',     '0901000002'),
  ('Trung tâm Quận 1',  'Trần Long',      '0901000003'),
  ('Trung tâm Quận 10', 'Võ Thanh Sơn',   '0901000010'),
  ('Trung tâm Quận 10', 'Đặng Minh Khoa', '0901000011')
) AS v(center_name, full_name, phone)
JOIN service_center c ON c.name = v.center_name
ON CONFLICT (phone) DO NOTHING;

-- Tay nghề theo nhóm sự cố (thang 1–5; đề xuất tự động chỉ lấy ≥ 3 – QT-03)
INSERT INTO technician_skill (technician_id, issue_group, proficiency)
SELECT t.technician_id, v.issue_group, v.proficiency
FROM (VALUES
  ('0901000001', 'MAN_HINH', 5), ('0901000001', 'PIN', 3),
  ('0901000002', 'MAN_HINH', 4), ('0901000002', 'SAC', 4),
  ('0901000003', 'MAN_HINH', 3), ('0901000003', 'LOA', 2),
  ('0901000010', 'PIN', 5),      ('0901000010', 'SAC', 3),
  ('0901000011', 'MAN_HINH', 2), ('0901000011', 'LOA', 4)
) AS v(phone, issue_group, proficiency)
JOIN technician t ON t.phone = v.phone
ON CONFLICT (technician_id, issue_group) DO NOTHING;

-- 3 phiếu thử ở trạng thái MOI (mã cố định để chạy lại không nhân đôi)
INSERT INTO ticket (ticket_code, center_id, customer_name, customer_phone, device_model, issue_group, issue_description, priority, due_date)
SELECT v.code, c.center_id, v.customer_name, v.customer_phone, v.device_model, v.issue_group, v.descr, v.priority, now() + v.due
FROM (VALUES
  ('BH-0001', 'Trung tâm Quận 1',  'Nguyễn Văn Hòa', '0912000001', 'iPhone 13',     'MAN_HINH', 'Vỡ màn hình, cảm ứng không nhạy', 1, interval '6 hours'),
  ('BH-0002', 'Trung tâm Quận 1',  'Lê Thị Mai',     '0912000002', 'Galaxy S22',    'PIN',      'Pin chai, tụt nhanh',             2, interval '30 hours'),
  ('BH-0003', 'Trung tâm Quận 10', 'Phạm Quốc Bảo',  '0912000003', 'Redmi Note 11', 'SAC',      'Không nhận sạc',                  3, interval '3 days')
) AS v(code, center_name, customer_name, customer_phone, device_model, issue_group, descr, priority, due)
JOIN service_center c ON c.name = v.center_name
ON CONFLICT (ticket_code) DO NOTHING;

-- Đưa sequence lên sau mã lớn nhất đã dùng để POST /tickets không trùng mã seed
SELECT setval('ticket_code_seq', GREATEST((SELECT COALESCE(MAX(substring(ticket_code from 4)::int), 0) FROM ticket), 1));
