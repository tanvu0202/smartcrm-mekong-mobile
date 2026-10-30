-- db/migrations/003_appointment_unique_active.sql
-- Lịch hẹn bị hủy được giữ lại (status = 'DA_HUY', xóa mềm) nên ràng buộc "mỗi phiếu, mỗi loại, mỗi giờ bắt đầu chỉ một lịch"
-- chỉ được áp dụng cho lịch còn hiệu lực. Nếu không, hủy một lịch rồi đặt lại đúng khung giờ đó sẽ bị chặn nhầm.
-- Chạy lại nhiều lần vẫn an toàn (IF EXISTS / IF NOT EXISTS).
ALTER TABLE appointment DROP CONSTRAINT IF EXISTS appointment_ticket_id_appointment_type_start_time_key;
CREATE UNIQUE INDEX IF NOT EXISTS uq_appointment_active
    ON appointment (ticket_id, appointment_type, start_time) WHERE status = 'DA_DAT';
