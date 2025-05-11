package com.healthrecords.service;

import com.healthrecords.model.MedicalRecord;
import com.healthrecords.model.User;
import com.healthrecords.repository.MedicalRecordRepository;
import com.healthrecords.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final UserRepository userRepository;

    public List<MedicalRecord> getAllMedicalRecords() {
        List<MedicalRecord> records = medicalRecordRepository.findAll();
        System.out.println("Retrieved " + records.size() + " medical records");

        // Ensure we have the full User entities for doctor and patient in each record
        for (MedicalRecord record : records) {
            if (record.getPatient() != null && record.getPatient().getId() != null) {
                User patient = userRepository.findById(record.getPatient().getId())
                        .orElseThrow(() -> new EntityNotFoundException("Patient not found with ID: " + record.getPatient().getId()));
                record.setPatient(patient);
            }

            if (record.getDoctor() != null && record.getDoctor().getId() != null) {
                User doctor = userRepository.findById(record.getDoctor().getId())
                        .orElseThrow(() -> new EntityNotFoundException("Doctor not found with ID: " + record.getDoctor().getId()));
                record.setDoctor(doctor);
            }
        }

        return records;
    }

    public MedicalRecord getMedicalRecordById(Long id) {
        System.out.println("Getting medical record by ID: " + id);
        MedicalRecord record = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Medical record not found with id: " + id));

        // Ensure we have the full User entities for doctor and patient
        if (record.getPatient() != null && record.getPatient().getId() != null) {
            User patient = userRepository.findById(record.getPatient().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Patient not found with ID: " + record.getPatient().getId()));
            record.setPatient(patient);
        }

        if (record.getDoctor() != null && record.getDoctor().getId() != null) {
            User doctor = userRepository.findById(record.getDoctor().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Doctor not found with ID: " + record.getDoctor().getId()));
            record.setDoctor(doctor);
        }

        // Log the retrieved record details
        System.out.println("Retrieved medical record: " + record);
        System.out.println("Patient: " + (record.getPatient() != null ?
            record.getPatient().getId() + " - " + record.getPatient().getFirstName() + " " + record.getPatient().getLastName() : "null"));
        System.out.println("Doctor: " + (record.getDoctor() != null ?
            record.getDoctor().getId() + " - " + record.getDoctor().getFirstName() + " " + record.getDoctor().getLastName() : "null"));

        return record;
    }

    public MedicalRecord createMedicalRecord(MedicalRecord medicalRecord) {
        validateUserReferences(medicalRecord);
        return medicalRecordRepository.save(medicalRecord);
    }

    public MedicalRecord updateMedicalRecord(Long id, MedicalRecord medicalRecord) {
        if (!medicalRecordRepository.existsById(id)) {
            throw new EntityNotFoundException("Medical record not found with id: " + id);
        }
        validateUserReferences(medicalRecord);
        medicalRecord.setId(id);
        return medicalRecordRepository.save(medicalRecord);
    }

    public void deleteMedicalRecord(Long id) {
        if (!medicalRecordRepository.existsById(id)) {
            throw new EntityNotFoundException("Medical record not found with id: " + id);
        }
        medicalRecordRepository.deleteById(id);
    }

    private final ObjectMapper objectMapper = new ObjectMapper();

    private void validateUserReferences(MedicalRecord medicalRecord) {
        System.out.println("Validating user references for medical record: " + medicalRecord);

        // Validate and set patient reference
        if (medicalRecord.getPatient() != null) {
            Long patientId = extractId(medicalRecord.getPatient(), "patient");

            if (patientId != null) {
                System.out.println("Looking up patient with ID: " + patientId);
                User patient = userRepository.findById(patientId)
                        .orElseThrow(() -> new EntityNotFoundException("Patient not found with ID: " + patientId));
                medicalRecord.setPatient(patient);
                System.out.println("Set patient: " + patient.getFirstName() + " " + patient.getLastName());
            } else {
                throw new IllegalArgumentException("Patient ID is required");
            }
        } else {
            throw new IllegalArgumentException("Patient is required");
        }

        // Validate and set doctor reference
        if (medicalRecord.getDoctor() != null) {
            Long doctorId = extractId(medicalRecord.getDoctor(), "doctor");

            if (doctorId != null) {
                System.out.println("Looking up doctor with ID: " + doctorId);
                User doctor = userRepository.findById(doctorId)
                        .orElseThrow(() -> new EntityNotFoundException("Doctor not found with ID: " + doctorId));
                medicalRecord.setDoctor(doctor);
                System.out.println("Set doctor: " + doctor.getFirstName() + " " + doctor.getLastName());
            } else {
                throw new IllegalArgumentException("Doctor ID is required");
            }
        } else {
            throw new IllegalArgumentException("Doctor is required");
        }
    }

    private Long extractId(Object obj, String fieldName) {
        try {
            if (obj instanceof User) {
                return ((User) obj).getId();
            } else if (obj instanceof Map) {
                Map<?, ?> map = (Map<?, ?>) obj;
                if (map.containsKey("id")) {
                    Object id = map.get("id");
                    if (id instanceof Number) {
                        return ((Number) id).longValue();
                    } else if (id instanceof String) {
                        return Long.parseLong((String) id);
                    }
                }
            } else {
                // Try to convert to a Map using Jackson
                @SuppressWarnings("unchecked")
                Map<String, Object> map = objectMapper.convertValue(obj, Map.class);
                if (map.containsKey("id")) {
                    Object id = map.get("id");
                    if (id instanceof Number) {
                        return ((Number) id).longValue();
                    } else if (id instanceof String) {
                        return Long.parseLong((String) id);
                    }
                }
            }

            // If we get here, try to directly parse the object as a number or string
            if (obj instanceof Number) {
                return ((Number) obj).longValue();
            } else if (obj instanceof String) {
                return Long.parseLong((String) obj);
            }

            System.out.println("Could not extract ID from " + fieldName + ": " + obj);
            return null;
        } catch (Exception e) {
            System.out.println("Error extracting ID from " + fieldName + ": " + e.getMessage());
            return null;
        }
    }
}
