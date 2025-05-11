package com.healthrecords.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Simple DTO for direct appointment creation
 * This is used for the no-security endpoint
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DirectAppointmentRequest {
    private Long doctorId;
    private Long patientId;
    private String appointmentDateTime;
    private String title;
    private String description;
    private String notes;
    private Boolean isVideoConsultation;
    private String meetingLink;
}
