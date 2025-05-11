package com.healthrecords.dto;

import com.healthrecords.model.Appointment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AppointmentRequest {
    private Long doctorId;
    private Long patientId;
    private LocalDateTime appointmentDateTime;
    private String title;
    private String description;
    private Appointment.AppointmentStatus status;
    private String notes;
    private Boolean isVideoConsultation;
    private String meetingLink;
}
