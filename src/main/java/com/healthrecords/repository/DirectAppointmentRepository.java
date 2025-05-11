package com.healthrecords.repository;

import com.healthrecords.model.Appointment;
import com.healthrecords.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for direct appointment creation using JDBC
 * This bypasses JPA and Hibernate to avoid any potential enum conversion issues
 */
@Repository
public class DirectAppointmentRepository {

    private final JdbcTemplate jdbcTemplate;
    private final AppointmentRepository appointmentRepository;

    @Autowired
    public DirectAppointmentRepository(JdbcTemplate jdbcTemplate, AppointmentRepository appointmentRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.appointmentRepository = appointmentRepository;
    }

    /**
     * Get all appointments for a specific doctor using direct SQL
     * This bypasses JPA and Hibernate to avoid any potential issues
     */
    public List<Appointment> getAppointmentsForDoctor(Long doctorId) {
        String sql = "SELECT * FROM appointments WHERE doctor_id = ?";

        System.out.println("DirectAppointmentRepository: Getting appointments for doctor ID: " + doctorId);

        List<Appointment> appointments = jdbcTemplate.query(sql, new Object[]{doctorId}, (rs, rowNum) -> {
            // Map the result set to an Appointment object
            Long id = rs.getLong("id");
            return appointmentRepository.findById(id).orElse(null);
        });

        System.out.println("DirectAppointmentRepository: Found " + appointments.size() + " appointments for doctor ID: " + doctorId);

        return appointments;
    }

    /**
     * Save an appointment directly to the database using JDBC
     * This bypasses JPA and Hibernate to avoid any potential enum conversion issues
     */
    public Appointment saveAppointmentDirectly(Appointment appointment) {
        // First save the appointment using JPA to get an ID
        Appointment savedAppointment = appointmentRepository.save(appointment);

        // Then update the status directly using JDBC to ensure the correct enum value is used
        String sql = "UPDATE appointments SET status = ? WHERE id = ?";
        jdbcTemplate.update(sql, "PENDING", savedAppointment.getId());

        // Reload the appointment to get the updated status
        return appointmentRepository.findById(savedAppointment.getId()).orElse(savedAppointment);
    }

    /**
     * Create a new appointment directly in the database using JDBC
     * This bypasses JPA and Hibernate to avoid any potential enum conversion issues
     */
    public Appointment createAppointmentDirectly(
            String title,
            String description,
            LocalDateTime appointmentDateTime,
            Long doctorId,
            Long patientId,
            Boolean isVideoConsultation,
            String meetingLink,
            String notes) {

        LocalDateTime now = LocalDateTime.now();

        // Insert the appointment directly using JDBC
        String sql = "INSERT INTO appointments (title, description, appointment_date_time, doctor_id, patient_id, " +
                "is_video_consultation, meeting_link, notes, status, created_at, updated_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        jdbcTemplate.update(sql,
                title,
                description,
                Timestamp.valueOf(appointmentDateTime),
                doctorId,
                patientId,
                isVideoConsultation,
                meetingLink,
                notes,
                "PENDING", // Use the string value directly to avoid enum conversion issues
                Timestamp.valueOf(now),
                Timestamp.valueOf(now));

        // Get the last inserted ID
        Long id = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);

        // Return the appointment
        return appointmentRepository.findById(id).orElseThrow(() ->
                new RuntimeException("Failed to retrieve newly created appointment with ID: " + id));
    }
}
