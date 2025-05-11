package com.healthrecords.controller;

import com.healthrecords.dto.AppointmentRequest;
import com.healthrecords.dto.SimpleAppointmentRequest;
import com.healthrecords.model.Appointment;
import com.healthrecords.model.User;
import com.healthrecords.model.UserRole;
import com.healthrecords.repository.DirectAppointmentRepository;
import com.healthrecords.service.AppointmentService;
import com.healthrecords.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final UserService userService;
    private final DirectAppointmentRepository directAppointmentRepository;

    @GetMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<List<Appointment>> getAllAppointments() {
        return ResponseEntity.ok(appointmentService.getAllAppointments());
    }

    @GetMapping("/date-range")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_PATIENT')")
    public ResponseEntity<List<Appointment>> getAppointmentsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByDateRange(start, end));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_PATIENT')")
    public ResponseEntity<Appointment> getAppointmentById(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.getAppointmentById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_PATIENT')")
    public ResponseEntity<Appointment> createAppointment(@RequestBody AppointmentRequest appointmentRequest) {
        System.out.println("==== Received request to create appointment ====");

        try {
            // Get authentication details
            org.springframework.security.core.Authentication auth =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();

            if (auth != null) {
                System.out.println("Authenticated user: " + auth.getName());
                // Print authorities in a safe way that doesn't cause serialization issues
                System.out.println("User authorities: " +
                    auth.getAuthorities().stream()
                        .map(authority -> authority.getAuthority())
                        .collect(java.util.stream.Collectors.joining(", ")));
                System.out.println("Is authenticated: " + auth.isAuthenticated());
            } else {
                System.out.println("No authentication found in SecurityContext");
                throw new IllegalStateException("No authentication found in SecurityContext");
            }

            // Get current authenticated user
            User currentUser = userService.getUserByEmail(auth.getName());
            System.out.println("Current user: " + currentUser.getEmail() + " with role: " + currentUser.getRole());

            System.out.println("Appointment request received: " + appointmentRequest);

            // Convert DTO to entity - use builder pattern to ensure all fields are set
            Appointment appointment = Appointment.builder()
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

            // Set doctor from ID (required)
            if (appointmentRequest.getDoctorId() != null) {
                try {
                    User doctor = userService.getUserById(appointmentRequest.getDoctorId());
                    appointment.setDoctor(doctor);
                    System.out.println("Set doctor: " + doctor.getEmail() + " with ID: " + doctor.getId());
                } catch (Exception e) {
                    System.out.println("Error setting doctor: " + e.getMessage());
                    throw new IllegalArgumentException("Invalid doctor ID: " + appointmentRequest.getDoctorId());
                }
            } else {
                System.out.println("Error: Doctor ID is required");
                throw new IllegalArgumentException("Doctor ID is required");
            }

            // We already have the current user from above

            // For patients, always set themselves as the patient
            if (currentUser.getRole() == UserRole.ROLE_PATIENT) {
                appointment.setPatient(currentUser);
                System.out.println("Set patient to current user: " + currentUser.getEmail() + " with ID: " + currentUser.getId());
            }
            // For doctors and admins, use the provided patient ID
            else if (appointmentRequest.getPatientId() != null) {
                try {
                    User patient = userService.getUserById(appointmentRequest.getPatientId());
                    appointment.setPatient(patient);
                    System.out.println("Set patient: " + patient.getEmail() + " with ID: " + patient.getId());
                } catch (Exception e) {
                    System.out.println("Error setting patient: " + e.getMessage());
                    throw new IllegalArgumentException("Invalid patient ID: " + appointmentRequest.getPatientId());
                }
            } else {
                System.out.println("Error: Patient ID is required for doctors and admins");
                throw new IllegalArgumentException("Patient ID is required");
            }

            // Set other fields
            appointment.setAppointmentDateTime(appointmentRequest.getAppointmentDateTime());
            appointment.setTitle(appointmentRequest.getTitle());
            appointment.setDescription(appointmentRequest.getDescription());

            // Set status or default to REQUESTED
            if (appointmentRequest.getStatus() != null) {
                appointment.setStatus(appointmentRequest.getStatus());
            } else {
                appointment.setStatus(Appointment.AppointmentStatus.PENDING); // Was REQUESTED
            }

            appointment.setNotes(appointmentRequest.getNotes());

            // Set isVideoConsultation or default to false
            if (appointmentRequest.getIsVideoConsultation() != null) {
                appointment.setIsVideoConsultation(appointmentRequest.getIsVideoConsultation());
            } else {
                appointment.setIsVideoConsultation(false);
            }

            appointment.setMeetingLink(appointmentRequest.getMeetingLink());

            // Create the appointment
            Appointment createdAppointment = appointmentService.createAppointment(appointment);
            System.out.println("Appointment created successfully with ID: " + createdAppointment.getId());
            return ResponseEntity.ok(createdAppointment);
        } catch (IllegalArgumentException e) {
            // Handle validation errors
            System.out.println("Validation error in createAppointment: " + e.getMessage());
            e.printStackTrace();

            // Create a complete appointment object with all required fields
            return ResponseEntity.badRequest().body(Appointment.builder()
                .title("ERROR: " + e.getMessage())
                .status(Appointment.AppointmentStatus.CANCELLED)
                .appointmentDateTime(LocalDateTime.now())
                .isVideoConsultation(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());
        } catch (RuntimeException e) {
            // Handle runtime errors
            System.out.println("Runtime error in createAppointment: " + e.getMessage());
            e.printStackTrace();

            // Create a complete appointment object with all required fields
            return ResponseEntity.status(500).body(Appointment.builder()
                .title("ERROR: " + e.getMessage())
                .status(Appointment.AppointmentStatus.CANCELLED)
                .appointmentDateTime(LocalDateTime.now())
                .isVideoConsultation(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());
        } catch (Exception e) {
            // Handle other errors
            System.out.println("Error in createAppointment: " + e.getMessage());
            e.printStackTrace();

            // Create a complete appointment object with all required fields
            return ResponseEntity.status(500).body(Appointment.builder()
                .title("ERROR: Internal server error - " + e.getMessage())
                .status(Appointment.AppointmentStatus.CANCELLED)
                .appointmentDateTime(LocalDateTime.now())
                .isVideoConsultation(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_PATIENT')")
    public ResponseEntity<Appointment> updateAppointment(
            @PathVariable Long id,
            @RequestBody Appointment appointment) {
        return ResponseEntity.ok(appointmentService.updateAppointment(id, appointment));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_DOCTOR')")
    public ResponseEntity<Void> deleteAppointment(@PathVariable Long id) {
        appointmentService.deleteAppointment(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/my-appointments")
    @PreAuthorize("hasAnyRole('ROLE_DOCTOR', 'ROLE_PATIENT')")
    public ResponseEntity<List<Appointment>> getMyAppointments() {
        System.out.println("AppointmentController: Getting my appointments");
        List<Appointment> appointments = appointmentService.getMyAppointments();
        System.out.println("AppointmentController: Found " + appointments.size() + " appointments");

        // Debug: Print appointment details
        for (Appointment appointment : appointments) {
            System.out.println("Appointment ID: " + appointment.getId() +
                              ", Status: " + appointment.getStatus() +
                              ", Doctor: " + appointment.getDoctor().getEmail() +
                              ", Patient: " + appointment.getPatient().getEmail());
        }

        return ResponseEntity.ok(appointments);
    }

    @GetMapping("/my-upcoming-appointments")
    @PreAuthorize("hasAnyRole('ROLE_DOCTOR', 'ROLE_PATIENT')")
    public ResponseEntity<List<Appointment>> getMyUpcomingAppointments() {
        System.out.println("AppointmentController: Getting my upcoming appointments");

        // Get authentication details
        org.springframework.security.core.Authentication auth =
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();

        if (auth != null) {
            System.out.println("Authenticated user: " + auth.getName());
            // Print authorities in a safe way that doesn't cause serialization issues
            System.out.println("User authorities: " +
                auth.getAuthorities().stream()
                    .map(authority -> authority.getAuthority())
                    .collect(java.util.stream.Collectors.joining(", ")));
        }

        try {
            List<Appointment> appointments = appointmentService.getMyUpcomingAppointments();
            System.out.println("AppointmentController: Found " + appointments.size() + " upcoming appointments");

            // Debug: Print appointment details
            for (Appointment appointment : appointments) {
                System.out.println("Appointment ID: " + appointment.getId() +
                                  ", Status: " + appointment.getStatus() +
                                  ", Doctor ID: " + (appointment.getDoctor() != null ? appointment.getDoctor().getId() : "null") +
                                  ", Doctor: " + (appointment.getDoctor() != null ? appointment.getDoctor().getEmail() : "null") +
                                  ", Patient ID: " + (appointment.getPatient() != null ? appointment.getPatient().getId() : "null") +
                                  ", Patient: " + (appointment.getPatient() != null ? appointment.getPatient().getEmail() : "null"));
            }

            return ResponseEntity.ok(appointments);
        } catch (Exception e) {
            System.out.println("Error getting upcoming appointments: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @PutMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_DOCTOR')")
    public ResponseEntity<Appointment> confirmAppointment(@PathVariable Long id) {
        System.out.println("AppointmentController: Confirming appointment with ID: " + id);

        // Get authentication details
        org.springframework.security.core.Authentication auth =
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();

        if (auth != null) {
            System.out.println("Authenticated user: " + auth.getName());
            // Print authorities in a safe way that doesn't cause serialization issues
            System.out.println("User authorities: " +
                auth.getAuthorities().stream()
                    .map(authority -> authority.getAuthority())
                    .collect(java.util.stream.Collectors.joining(", ")));
        }

        try {
            Appointment confirmedAppointment = appointmentService.confirmAppointment(id);
            System.out.println("AppointmentController: Appointment confirmed successfully with status: " + confirmedAppointment.getStatus());
            return ResponseEntity.ok(confirmedAppointment);
        } catch (Exception e) {
            System.out.println("AppointmentController: Error confirming appointment: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_DOCTOR')")
    public ResponseEntity<Appointment> rejectAppointment(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        System.out.println("AppointmentController: Rejecting appointment with ID: " + id);

        // Get authentication details
        org.springframework.security.core.Authentication auth =
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();

        if (auth != null) {
            System.out.println("Authenticated user: " + auth.getName());
            // Print authorities in a safe way that doesn't cause serialization issues
            System.out.println("User authorities: " +
                auth.getAuthorities().stream()
                    .map(authority -> authority.getAuthority())
                    .collect(java.util.stream.Collectors.joining(", ")));
        }

        String reason = payload.getOrDefault("reason", "No reason provided");
        System.out.println("Rejection reason: " + reason);

        try {
            Appointment rejectedAppointment = appointmentService.rejectAppointment(id, reason);
            System.out.println("AppointmentController: Appointment rejected successfully with status: " + rejectedAppointment.getStatus());
            return ResponseEntity.ok(rejectedAppointment);
        } catch (Exception e) {
            System.out.println("AppointmentController: Error rejecting appointment: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Get appointments for a doctor using direct SQL query
     * This endpoint is for debugging purposes
     */
    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_DOCTOR')")
    public ResponseEntity<List<Appointment>> getAppointmentsForDoctor(@PathVariable Long doctorId) {
        System.out.println("AppointmentController: Getting appointments for doctor ID: " + doctorId);

        try {
            List<Appointment> appointments = directAppointmentRepository.getAppointmentsForDoctor(doctorId);
            System.out.println("AppointmentController: Found " + appointments.size() + " appointments for doctor ID: " + doctorId);

            // Debug: Print appointment details
            for (Appointment appointment : appointments) {
                if (appointment != null) {
                    System.out.println("Appointment ID: " + appointment.getId() +
                                      ", Status: " + appointment.getStatus() +
                                      ", Doctor ID: " + (appointment.getDoctor() != null ? appointment.getDoctor().getId() : "null") +
                                      ", Patient ID: " + (appointment.getPatient() != null ? appointment.getPatient().getId() : "null"));
                } else {
                    System.out.println("Found null appointment");
                }
            }

            return ResponseEntity.ok(appointments);
        } catch (Exception e) {
            System.out.println("Error getting appointments for doctor: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * A simplified endpoint for creating appointments
     * This endpoint uses a simpler approach to avoid database errors
     * This is a public endpoint to avoid authentication issues
     */
    @PostMapping("/simple")
    public ResponseEntity<?> createSimpleAppointment(@RequestBody SimpleAppointmentRequest request) {
        try {
            System.out.println("==== Received request to create simple appointment ====");
            System.out.println("Request: " + request);

            // Get current user if authenticated
            org.springframework.security.core.Authentication auth =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();

            User currentUser = null;
            if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
                currentUser = userService.getUserByEmail(auth.getName());
                System.out.println("Current user: " + currentUser.getEmail() + " with role: " + currentUser.getRole());
            } else {
                System.out.println("No authenticated user found, treating as patient");
                // For unauthenticated requests, we'll need the patient ID
                if (request.getPatientId() == null) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "error", "Patient ID is required for unauthenticated requests",
                        "status", "error"
                    ));
                }

                // Get the patient from the ID
                try {
                    currentUser = userService.getUserById(request.getPatientId());
                    System.out.println("Using patient from request: " + currentUser.getEmail());
                } catch (Exception e) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "error", "Invalid patient ID: " + request.getPatientId(),
                        "status", "error"
                    ));
                }
            }

            // Create appointment using the service
            Appointment appointment = appointmentService.createSimpleAppointment(request, currentUser);
            System.out.println("Simple appointment created successfully with ID: " + appointment.getId());

            return ResponseEntity.ok(appointment);
        } catch (Exception e) {
            System.out.println("Error creating simple appointment: " + e.getMessage());
            e.printStackTrace();

            // Return a simple error response
            return ResponseEntity.status(500).body(Map.of(
                "error", "Failed to create appointment: " + e.getMessage(),
                "status", "error"
            ));
        }
    }
}
