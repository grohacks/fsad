-- V4__add_payment_fields_to_appointments.sql

-- Add payment-related fields to the existing appointments table
ALTER TABLE appointments 
ADD COLUMN payment_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN payment_status ENUM('UNPAID', 'PAID', 'REFUNDED') DEFAULT 'UNPAID',
ADD COLUMN payment_method VARCHAR(50),
ADD COLUMN payment_date TIMESTAMP NULL,
ADD COLUMN payment_reference VARCHAR(255),
ADD COLUMN payment_notes TEXT;