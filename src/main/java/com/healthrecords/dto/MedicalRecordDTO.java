package com.healthrecords.dto;

import com.healthrecords.model.LabReport;
import com.healthrecords.model.MedicalRecord;
import com.healthrecords.model.Prescription;
import com.healthrecords.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecordDTO {
    private Long id;
    private UserDTO patient;
    private UserDTO doctor;
    private String diagnosis;
    private String treatment;
    private String notes;
    private Set<PrescriptionDTO> prescriptions;
    private Set<LabReportDTO> labReports;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MedicalRecordDTO fromMedicalRecord(MedicalRecord medicalRecord) {
        if (medicalRecord == null) {
            return null;
        }

        // Convert prescriptions to DTOs
        Set<PrescriptionDTO> prescriptionDTOs = medicalRecord.getPrescriptions() != null
                ? medicalRecord.getPrescriptions().stream()
                    .map(PrescriptionDTO::fromPrescription)
                    .collect(Collectors.toSet())
                : new HashSet<>();

        // Convert lab reports to DTOs
        Set<LabReportDTO> labReportDTOs = medicalRecord.getLabReports() != null
                ? medicalRecord.getLabReports().stream()
                    .map(LabReportDTO::fromLabReport)
                    .collect(Collectors.toSet())
                : new HashSet<>();

        // Create patient DTO with extra logging
        UserDTO patientDTO = null;
        if (medicalRecord.getPatient() != null) {
            System.out.println("Converting patient to DTO: " + medicalRecord.getPatient().getId() +
                " - " + medicalRecord.getPatient().getFirstName() + " " + medicalRecord.getPatient().getLastName());
            patientDTO = UserDTO.fromUser(medicalRecord.getPatient());
            System.out.println("Patient DTO: " + patientDTO);
        } else {
            System.out.println("Patient is null in medical record");
        }

        // Create doctor DTO with extra logging
        UserDTO doctorDTO = null;
        if (medicalRecord.getDoctor() != null) {
            System.out.println("Converting doctor to DTO: " + medicalRecord.getDoctor().getId() +
                " - " + medicalRecord.getDoctor().getFirstName() + " " + medicalRecord.getDoctor().getLastName());
            doctorDTO = UserDTO.fromUser(medicalRecord.getDoctor());
            System.out.println("Doctor DTO: " + doctorDTO);
        } else {
            System.out.println("Doctor is null in medical record");
        }

        return MedicalRecordDTO.builder()
                .id(medicalRecord.getId())
                .patient(patientDTO)
                .doctor(doctorDTO)
                .diagnosis(medicalRecord.getDiagnosis())
                .treatment(medicalRecord.getTreatment())
                .notes(medicalRecord.getNotes())
                .prescriptions(prescriptionDTOs)
                .labReports(labReportDTOs)
                .createdAt(medicalRecord.getCreatedAt())
                .updatedAt(medicalRecord.getUpdatedAt())
                .build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PrescriptionDTO {
        private Long id;
        private String medicationName;
        private String dosage;
        private String instructions;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static PrescriptionDTO fromPrescription(Prescription prescription) {
            if (prescription == null) {
                return null;
            }

            return PrescriptionDTO.builder()
                    .id(prescription.getId())
                    .medicationName(prescription.getMedicationName())
                    .dosage(prescription.getDosage())
                    .instructions(prescription.getInstructions())
                    .startDate(prescription.getStartDate())
                    .endDate(prescription.getEndDate())
                    .createdAt(prescription.getCreatedAt())
                    .updatedAt(prescription.getUpdatedAt())
                    .build();
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LabReportDTO {
        private Long id;
        private String testName;
        private String testResults;
        private String fileUrl;
        private String fileName;
        private String fileType;
        private Long fileSize;
        private LocalDateTime testDate;
        private LocalDateTime reportDate;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static LabReportDTO fromLabReport(LabReport labReport) {
            if (labReport == null) {
                return null;
            }

            return LabReportDTO.builder()
                    .id(labReport.getId())
                    .testName(labReport.getTestName())
                    .testResults(labReport.getTestResults())
                    .fileUrl(labReport.getFileUrl())
                    .fileName(labReport.getFileName())
                    .fileType(labReport.getFileType())
                    .fileSize(labReport.getFileSize())
                    .testDate(labReport.getTestDate())
                    .reportDate(labReport.getReportDate())
                    .createdAt(labReport.getCreatedAt())
                    .updatedAt(labReport.getUpdatedAt())
                    .build();
        }
    }
}
