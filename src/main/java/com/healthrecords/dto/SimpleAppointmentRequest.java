package com.healthrecords.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * A simplified DTO for creating appointments with minimal required fields
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SimpleAppointmentRequest {
    private Long doctorId;
    private Long patientId;
    private LocalDateTime appointmentDateTime;
    private String title;
    private String description;
    private Boolean isVideoConsultation;
    private String meetingLink;
    private String notes;
}
