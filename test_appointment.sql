USE health_records;

-- Get a patient ID
SET @patient_id = (SELECT id FROM users WHERE role = 'ROLE_PATIENT' LIMIT 1);

-- Get a doctor ID
SET @doctor_id = (SELECT id FROM users WHERE role = 'ROLE_DOCTOR' LIMIT 1);

-- Insert a test appointment
INSERT INTO appointments (
    patient_id,
    doctor_id,
    appointment_date_time,
    title,
    description,
    status,
    notes,
    is_video_consultation,
    meeting_link,
    created_at,
    updated_at
) VALUES (
    @patient_id,
    @doctor_id,
    NOW() + INTERVAL 1 DAY,
    'Test Appointment',
    'This is a test appointment',
    'CONFIRMED',
    'Test notes',
    1,
    'https://meet.example.com/test',
    NOW(),
    NOW()
);
