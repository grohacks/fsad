package com.healthrecords.controller;

import com.healthrecords.dto.MedicalRecordDTO;
import com.healthrecords.model.MedicalRecord;
import com.healthrecords.service.MedicalRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medical-records")
@RequiredArgsConstructor
public class MedicalRecordsController {

    private final MedicalRecordService medicalRecordService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ROLE_DOCTOR', 'ROLE_ADMIN', 'ROLE_PATIENT')")
    public ResponseEntity<List<MedicalRecordDTO>> getAllMedicalRecords() {
        List<MedicalRecord> records = medicalRecordService.getAllMedicalRecords();
        System.out.println("Returning " + records.size() + " medical records");

        List<MedicalRecordDTO> recordDTOs = records.stream()
            .map(MedicalRecordDTO::fromMedicalRecord)
            .toList();

        return ResponseEntity.ok(recordDTOs);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_DOCTOR', 'ROLE_ADMIN', 'ROLE_PATIENT')")
    public ResponseEntity<MedicalRecordDTO> getMedicalRecordById(@PathVariable Long id) {
        System.out.println("==== Received request to get medical record by ID: " + id + " ====");

        try {
            MedicalRecord medicalRecord = medicalRecordService.getMedicalRecordById(id);
            System.out.println("Retrieved medical record from service: " + medicalRecord);

            if (medicalRecord.getPatient() != null) {
                System.out.println("Patient in controller: " + medicalRecord.getPatient().getId() +
                    " - " + medicalRecord.getPatient().getFirstName() + " " + medicalRecord.getPatient().getLastName());
            } else {
                System.out.println("Patient is null in controller");
            }

            if (medicalRecord.getDoctor() != null) {
                System.out.println("Doctor in controller: " + medicalRecord.getDoctor().getId() +
                    " - " + medicalRecord.getDoctor().getFirstName() + " " + medicalRecord.getDoctor().getLastName());
            } else {
                System.out.println("Doctor is null in controller");
            }

            MedicalRecordDTO medicalRecordDTO = MedicalRecordDTO.fromMedicalRecord(medicalRecord);
            System.out.println("Created DTO: " + medicalRecordDTO);

            return ResponseEntity.ok(medicalRecordDTO);
        } catch (Exception e) {
            System.out.println("Error in getMedicalRecordById: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_DOCTOR', 'ROLE_ADMIN')")
    public ResponseEntity<MedicalRecordDTO> createMedicalRecord(@RequestBody MedicalRecord medicalRecord) {
        System.out.println("Creating medical record: " + medicalRecord);

        // Log authentication details for debugging
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            System.out.println("Authenticated user: " + auth.getName());
            System.out.println("User authorities: " +
                auth.getAuthorities().stream()
                    .map(authority -> authority.getAuthority())
                    .collect(java.util.stream.Collectors.joining(", ")));
            System.out.println("Is authenticated: " + auth.isAuthenticated());
        } else {
            System.out.println("No authentication found in SecurityContext");
        }

        MedicalRecord createdRecord = medicalRecordService.createMedicalRecord(medicalRecord);
        MedicalRecordDTO recordDTO = MedicalRecordDTO.fromMedicalRecord(createdRecord);
        return ResponseEntity.status(HttpStatus.CREATED).body(recordDTO);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_DOCTOR', 'ROLE_ADMIN')")
    public ResponseEntity<MedicalRecordDTO> updateMedicalRecord(@PathVariable Long id, @RequestBody MedicalRecord medicalRecord) {
        MedicalRecord updatedRecord = medicalRecordService.updateMedicalRecord(id, medicalRecord);
        MedicalRecordDTO recordDTO = MedicalRecordDTO.fromMedicalRecord(updatedRecord);
        return ResponseEntity.ok(recordDTO);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_DOCTOR', 'ROLE_ADMIN')")
    public ResponseEntity<Void> deleteMedicalRecord(@PathVariable Long id) {
        medicalRecordService.deleteMedicalRecord(id);
        return ResponseEntity.ok().build();
    }
}
