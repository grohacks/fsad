package com.healthrecords.service;

import com.healthrecords.dto.DirectAppointmentRequest;
import com.healthrecords.model.Appointment;
import com.healthrecords.model.User;
import com.healthrecords.repository.DirectAppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Service for direct appointment creation
 * This service bypasses all security and validation
 */
@Service
@RequiredArgsConstructor
public class DirectAppointmentService {

    private final DirectAppointmentRepository directAppointmentRepository;
    private final UserService userService;
    private final NotificationService notificationService;

    /**
     * Create a new appointment directly
     * This method bypasses all security and validation
     */
    @Transactional
    public Appointment createDirectAppointment(DirectAppointmentRequest request) {
        try {
            // Get the doctor and patient
            User doctor = userService.getUserById(request.getDoctorId());
            User patient = userService.getUserById(request.getPatientId());

            // Parse appointment date time
            LocalDateTime appointmentDateTime = LocalDateTime.parse(request.getAppointmentDateTime().substring(0, 19));

            // Create appointment with explicit status
            // Use the correct enum value that matches the database schema
            Appointment.AppointmentStatus statusValue = Appointment.AppointmentStatus.PENDING; // This was REQUESTED before
            System.out.println("DirectAppointmentService: Using status: " + statusValue);

            // Debug: Print all available status values
            System.out.println("DirectAppointmentService: Available status values:");
            for (Appointment.AppointmentStatus status : Appointment.AppointmentStatus.values()) {
                System.out.println("- " + status.name());
            }

            // Log appointment details before saving
            System.out.println("DirectAppointmentService: Creating appointment with the following details:");
            System.out.println("- Title: " + request.getTitle());
            System.out.println("- Description: " + request.getDescription());
            System.out.println("- Doctor ID: " + doctor.getId());
            System.out.println("- Patient ID: " + patient.getId());
            System.out.println("- Date/Time: " + appointmentDateTime);
            System.out.println("- Status: PENDING (hardcoded)");

            // Create appointment directly using JDBC to avoid any potential enum conversion issues
            Appointment savedAppointment = directAppointmentRepository.createAppointmentDirectly(
                request.getTitle(),
                request.getDescription(),
                appointmentDateTime,
                doctor.getId(),
                patient.getId(),
                request.getIsVideoConsultation() != null ? request.getIsVideoConsultation() : false,
                request.getMeetingLink(),
                request.getNotes()
            );
            System.out.println("DirectAppointmentService: Appointment saved with ID: " + savedAppointment.getId());

            // Create notification for the doctor
            createDoctorNotification(savedAppointment);

            return savedAppointment;
        } catch (Exception e) {
            System.out.println("DirectAppointmentService: Error creating appointment: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Create a notification for the doctor about a new appointment request
     */
    private void createDoctorNotification(Appointment appointment) {
        try {
            // Create and save notification using the service
            notificationService.createAppointmentRequestNotification(appointment);
            System.out.println("DirectAppointmentService: Notification created for doctor: " + appointment.getDoctor().getEmail());
        } catch (Exception e) {
            System.out.println("DirectAppointmentService: Error creating notification: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
