-- Make medical_record_id column nullable in lab_reports table
ALTER TABLE lab_reports MODIFY COLUMN medical_record_id BIGINT NULL;
