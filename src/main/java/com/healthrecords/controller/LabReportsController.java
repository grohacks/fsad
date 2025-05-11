package com.healthrecords.controller;

import com.healthrecords.dto.LabReportDTO;
import com.healthrecords.service.LabReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/lab-reports")
@RequiredArgsConstructor
public class LabReportsController {

    private final LabReportService labReportService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ROLE_DOCTOR', 'ROLE_ADMIN', 'ROLE_PATIENT')")
    public ResponseEntity<List<LabReportDTO>> getAllLabReports() {
        return ResponseEntity.ok(labReportService.getAllLabReports());
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ROLE_DOCTOR', 'ROLE_ADMIN', 'ROLE_PATIENT')")
    public ResponseEntity<List<LabReportDTO>> getLabReportsByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(labReportService.getLabReportsByPatient(patientId));
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('ROLE_DOCTOR', 'ROLE_ADMIN')")
    public ResponseEntity<List<LabReportDTO>> getLabReportsByDoctor(@PathVariable Long doctorId) {
        return ResponseEntity.ok(labReportService.getLabReportsByDoctor(doctorId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_DOCTOR', 'ROLE_ADMIN', 'ROLE_PATIENT')")
    public ResponseEntity<LabReportDTO> getLabReportById(@PathVariable Long id) {
        return ResponseEntity.ok(labReportService.getLabReportById(id));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ROLE_DOCTOR', 'ROLE_ADMIN')")
    public ResponseEntity<LabReportDTO> createLabReport(
            @RequestPart("labReport") @Valid LabReportDTO labReportDTO,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        try {
            // Log the incoming request for debugging
            System.out.println("Creating lab report with DTO: " + labReportDTO);
            System.out.println("Medical Record ID: " + labReportDTO.getMedicalRecordId());

            LabReportDTO createdReport = labReportService.createLabReport(labReportDTO, file);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdReport);
        } catch (Exception e) {
            // Log the error for debugging
            System.err.println("Error creating lab report: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping("/{id}/download")
    @PreAuthorize("hasAnyRole('ROLE_DOCTOR', 'ROLE_ADMIN', 'ROLE_PATIENT')")
    public ResponseEntity<byte[]> downloadLabReport(@PathVariable Long id) {
        return labReportService.downloadLabReport(id);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ROLE_DOCTOR', 'ROLE_ADMIN')")
    public ResponseEntity<LabReportDTO> updateLabReport(
            @PathVariable Long id,
            @RequestPart("labReport") @Valid LabReportDTO labReportDTO,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        return ResponseEntity.ok(labReportService.updateLabReport(id, labReportDTO, file));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_DOCTOR', 'ROLE_ADMIN')")
    public ResponseEntity<Void> deleteLabReport(@PathVariable Long id) {
        labReportService.deleteLabReport(id);
        return ResponseEntity.noContent().build();
    }
}
