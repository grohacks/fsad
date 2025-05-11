package com.healthrecords.dto;

import com.healthrecords.model.LabReport;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabReportDTO {
    private Long id;
    private UserDTO patient;
    private UserDTO doctor;
    private Long medicalRecordId;
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
    
    // Transient field for file upload (not stored in database)
    private transient MultipartFile file;
    
    public static LabReportDTO fromLabReport(LabReport labReport) {
        if (labReport == null) {
            return null;
        }
        
        return LabReportDTO.builder()
                .id(labReport.getId())
                .patient(labReport.getPatient() != null ? UserDTO.fromUser(labReport.getPatient()) : null)
                .doctor(labReport.getDoctor() != null ? UserDTO.fromUser(labReport.getDoctor()) : null)
                .medicalRecordId(labReport.getMedicalRecord() != null ? labReport.getMedicalRecord().getId() : null)
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
