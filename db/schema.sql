-- db/schema.sql · Mekong Mobile – L4 Phân công kỹ thuật viên và lịch hẹn (PostgreSQL)

CREATE TABLE service_center (
    center_id     SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL UNIQUE,
    address       VARCHAR(255) NOT NULL,
    phone         VARCHAR(20)
);

CREATE TABLE technician (
    technician_id SERIAL PRIMARY KEY,
    center_id     INT          NOT NULL REFERENCES service_center(center_id),
    full_name     VARCHAR(100) NOT NULL,
    phone         VARCHAR(20)  NOT NULL UNIQUE,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE technician_skill (
    technician_id INT         NOT NULL REFERENCES technician(technician_id),
    issue_group   VARCHAR(30) NOT NULL,
    proficiency   SMALLINT    NOT NULL CHECK (proficiency BETWEEN 1 AND 5),
    PRIMARY KEY (technician_id, issue_group)
);

CREATE TABLE ticket (
    ticket_id         SERIAL PRIMARY KEY,
    ticket_code       VARCHAR(20)  NOT NULL UNIQUE,
    center_id         INT          NOT NULL REFERENCES service_center(center_id),
    technician_id     INT          REFERENCES technician(technician_id),
    customer_name     VARCHAR(100) NOT NULL,
    customer_phone    VARCHAR(20)  NOT NULL,
    device_model      VARCHAR(100) NOT NULL,
    issue_group       VARCHAR(30)  NOT NULL,
    issue_description TEXT,
    priority          SMALLINT     NOT NULL CHECK (priority IN (1, 2, 3)),  -- 1=CAO 2=TB 3=THAP
    status            VARCHAR(20)  NOT NULL DEFAULT 'MOI'
        CHECK (status IN ('MOI', 'DA_PHAN_CONG', 'DANG_XU_LY', 'HOAN_TAT')),
    due_date          TIMESTAMPTZ  NOT NULL,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    -- QT-02: chỉ có KTV khi đã phân công
    CHECK ((status = 'MOI' AND technician_id IS NULL)
        OR (status <> 'MOI' AND technician_id IS NOT NULL))
);

CREATE TABLE appointment (
    appointment_id   SERIAL PRIMARY KEY,
    ticket_id        INT         NOT NULL REFERENCES ticket(ticket_id),
    appointment_type VARCHAR(10) NOT NULL CHECK (appointment_type IN ('GIAO', 'NHAN')),
    start_time       TIMESTAMPTZ NOT NULL,
    end_time         TIMESTAMPTZ NOT NULL,
    status           VARCHAR(10) NOT NULL DEFAULT 'DA_DAT' CHECK (status IN ('DA_DAT', 'DA_HUY')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (end_time > start_time),
    UNIQUE (ticket_id, appointment_type, start_time)
);

CREATE TABLE ticket_log (
    log_id            BIGSERIAL PRIMARY KEY,
    ticket_id         INT          NOT NULL REFERENCES ticket(ticket_id),
    action            VARCHAR(20)  NOT NULL 
        CHECK (action IN ('PHAN_CONG', 'DOI_KTV', 'DOI_TRANG_THAI')),
    old_technician_id INT          REFERENCES technician(technician_id),
    new_technician_id INT          REFERENCES technician(technician_id),
    old_status        VARCHAR(20),
    new_status        VARCHAR(20),
    reason            VARCHAR(255),
    changed_by        VARCHAR(50)  NOT NULL,
    changed_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    -- QT-04: đổi KTV bắt buộc có lý do
    CHECK (action <> 'DOI_KTV' OR (reason IS NOT NULL AND length(trim(reason)) > 0))
);

-- Index gắn với NFR
CREATE INDEX idx_ticket_queue    ON ticket (center_id, status, priority, due_date);   -- NFR02
CREATE INDEX idx_ticket_tech     ON ticket (technician_id, status, due_date);          -- NFR01, NFR02
CREATE INDEX idx_appt_ticket     ON appointment (ticket_id, start_time, end_time);     -- FR04
CREATE INDEX idx_log_ticket_time ON ticket_log (ticket_id, changed_at);                -- NFR05
